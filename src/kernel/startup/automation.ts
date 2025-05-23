import type {
  AutomationAccountData,
  AutomationAccountFileData,
  AutomationAccountServerData,
  AutomationServiceActionConfig,
  AutomationServiceStatusResponse,
} from '../../types/automation'

import { Collection } from '@discordjs/collection'

import { AutomationStatusType } from '../../config/constants/automation'
import { ElectronAPIEventKeys } from '../../config/constants/main-process'
import { PartyState } from '../../config/fortnite/events'

import { AccountProcess } from '../core/automation/account-processes'
import { AccountService } from '../core/automation/account-service'
import { Authentication } from '../core/authentication'
import { ClaimRewards } from '../core/claim-rewards'
import { MainWindow } from './windows/main'
import { AccountsManager } from './accounts'
import { DataDirectory } from './data-directory'

import { AutomationState } from '../../state/stw-operations/automation'

export class Automation {
  private static _accounts: Collection<
    string,
    AutomationAccountServerData
  > = new Collection()
  private static _processes: Collection<string, AccountProcess> =
    new Collection()
  private static _services: Collection<string, AccountService> =
    new Collection()

  static async load() {
    const { automation } = await DataDirectory.getAutomationFile()
    const accounts = AccountsManager.getAccounts()

    Object.values(automation).forEach((data) => {
      if (accounts.has(data.accountId)) {
        Automation._accounts.set(data.accountId, {
          ...data,
          status: AutomationStatusType.LOADING,
        })
        Automation.start(data)
      }
    })

    MainWindow.instance.webContents.send(
      ElectronAPIEventKeys.AutomationServiceResponseData,
      automation,
      false
    )
  }

  static async addAccount(accountId: string) {
    const result = await DataDirectory.getAutomationFile()
    const data = {
      accountId,
      actions: {
        claim: false,
        kick: false,
        transferMats: false,
      },
    }

    await DataDirectory.updateAutomationFile({
      ...result.automation,
      [accountId]: data,
    })
    Automation._accounts.set(data.accountId, {
      ...data,
      status: AutomationStatusType.LOADING,
    })
    Automation.start(data)
  }

  static async removeAccount(accountId: string) {
    Automation.updateAccountData(accountId, {
      status: AutomationStatusType.LOADING,
    })
    Automation.getProcessByAccountId(accountId)?.clearMissionIntervalId()
    Automation.getServiceByAccountId(accountId)?.destroy()

    await Automation.refreshData(accountId, true)
  }

  static async updateAction(
    accountId: string,
    config: AutomationServiceActionConfig
  ) {
    Automation.updateAccountData(accountId, {
      actions: {
        [config.type]: config.value,
      },
    })

    const current = Automation._accounts.get(accountId)

    if (!current) {
      return
    }

    const result = await DataDirectory.getAutomationFile()
    const data = {
      accountId,
      actions: {
        ...current.actions,
        [config.type]: config.value,
      },
    }

    await DataDirectory.updateAutomationFile({
      ...result.automation,
      [accountId]: data,
    })
  }

  static start(data: AutomationAccountFileData) {
    const setNewStatus = (status: AutomationStatusType) => {
      Automation.updateAccountData(data.accountId, {
        status,
      })
      MainWindow.instance.webContents.send(
        ElectronAPIEventKeys.AutomationServiceStartNotification,
        {
          accountId: data.accountId,
          status,
        } as AutomationServiceStatusResponse
      )
    }

    setNewStatus(AutomationStatusType.LOADING)

    const account = AccountsManager.getAccountById(data.accountId)!

    Authentication.verifyAccessToken(account)
      .then((accessToken) => {
        if (accessToken) {
          const accountProcess = new AccountProcess({
            accessToken,
            account,
          })
          const accountService = new AccountService({
            accessToken,
            account,
          })

          const initTimeout = setTimeout(() => {
            setNewStatus(AutomationStatusType.ERROR)
          }, 10_000) // 10 seconds

          accountService.onceSessionStarted(() => {
            setNewStatus(AutomationStatusType.LISTENING)
            clearTimeout(initTimeout)

            if (accountProcess.matchmaking.partyState === null) {
              const automationAccount = Automation.getAccountById(
                account.accountId
              )
              const actions = automationAccount
                ? Object.values(automationAccount.actions)
                : []

              if (actions.includes(true)) {
                accountProcess.checkMatchAtStartUp()
              }
            }
          })

          accountService.onDisconnected(() => {
            setNewStatus(AutomationStatusType.DISCONNECTED)
          })
          accountService.onMemberDisconnected((member) => {
            if (!member.ns || member.ns?.toLowerCase() !== 'fortnite') {
              return
            }

            if (member.account_id === accountService.accountId) {
              setNewStatus(AutomationStatusType.DISCONNECTED)
            }
          })
          accountService.onMemberExpired((member) => {
            if (!member.ns || member.ns?.toLowerCase() !== 'fortnite') {
              return
            }

            if (member.account_id === accountService.accountId) {
              setNewStatus(AutomationStatusType.DISCONNECTED)
            }
          })

          accountService.onMemberJoined((member) => {
            if (!member.ns || member.ns?.toLowerCase() !== 'fortnite') {
              return
            }

            if (member.account_id === accountService.accountId) {
              const automationAccount = Automation.getAccountById(
                data.accountId
              )

              if (automationAccount) {
                const wasItDisconnected =
                  automationAccount.status ===
                  AutomationStatusType.DISCONNECTED

                if (wasItDisconnected) {
                  setNewStatus(AutomationStatusType.LISTENING)
                }

                if (
                  automationAccount.status ===
                  AutomationStatusType.LISTENING
                ) {
                  accountProcess.preInit({
                    timeout: 20_000, // 20 seconds
                  })
                }
              }
            }
          })

          accountService.onMemberKicked(async (member) => {
            if (!member.ns || member.ns?.toLowerCase() !== 'fortnite') {
              return
            }

            if (member.account_id === accountService.accountId) {
              if (
                accountProcess.matchmaking.partyState ===
                  PartyState.POST_MATCHMAKING &&
                accountProcess.matchmaking.started === true
              ) {
                const automationAccount = Automation.getAccountById(
                  accountService.accountId
                )

                if (automationAccount?.actions.claim === true) {
                  await ClaimRewards.start([account], true)
                }
              }
            }
          })

          accountService.onPartyUpdated((party) => {
            if (party.ns?.toLowerCase() !== 'fortnite') {
              return
            }

            const partyState = party.party_state_updated[
              'Default:PartyState_s'
            ] as PartyState | undefined

            if (partyState !== undefined) {
              accountProcess.setMatchmaking({
                partyState: partyState,
              })

              if (
                accountProcess.matchmaking.partyState ===
                PartyState.POST_MATCHMAKING
              ) {
                accountProcess.preInit()
              }
            }
          })

          Automation._services.set(
            accountService.accountId,
            accountService
          )
          Automation._processes.set(
            accountProcess.accountId,
            accountProcess
          )

          return
        }

        setNewStatus(AutomationStatusType.ERROR)
      })
      .catch(() => {
        setNewStatus(AutomationStatusType.ERROR)
      })
  }

  // static async reload(accountId: string) {
  //   const current = Automation._accounts.get(accountId)

  //   if (!current) {
  //     await Automation.refreshData(accountId)

  //     return
  //   }

  //   await Automation.start(current, true)
  // }

  static getAccountById(
    accountId: string
  ): AutomationAccountServerData | undefined {
    return Automation._accounts.get(accountId)
  }

  static getProcesses() {
    return Automation._processes.clone()
  }

  static getProcessByAccountId(accountId: string) {
    return Automation._processes.find(
      (accountProcess) => accountProcess.accountId === accountId
    )
  }

  static getServices() {
    return Automation._services.clone()
  }

  static getServiceByAccountId(accountId: string) {
    return Automation._services.find(
      (accountService) => accountService.accountId === accountId
    )
  }

  private static async refreshData(
    accountId: string,
    removeAccount?: boolean
  ) {
    const automation = Automation._accounts
      .filter((account) => account.accountId !== accountId)
      .map((account) => account)
      .reduce(
        (accumulator, account) => {
          accumulator[account.accountId] = {
            ...account,
          }

          return accumulator
        },
        {} as Parameters<AutomationState['refreshAccounts']>[0]
      )

    if (removeAccount) {
      Automation._accounts.delete(accountId)
      Automation._processes.delete(accountId)
      Automation._services.delete(accountId)
    }

    await DataDirectory.updateAutomationFile(automation)

    MainWindow.instance.webContents.send(
      ElectronAPIEventKeys.AutomationServiceResponseData,
      automation,
      true
    )
  }

  private static updateAccountData(
    accountId: string,
    data: Partial<{
      actions: Partial<AutomationAccountData['actions']>
      status: Partial<AutomationAccountData['status']>
    }>
  ) {
    const automationAccount = Automation.getAccountById(accountId)
    const accountProcess = Automation.getProcessByAccountId(accountId)

    if (automationAccount) {
      const actionsNewValueClaim =
        data.actions?.claim ?? automationAccount.actions.claim
      const actionsNewValueKick =
        data.actions?.kick ?? automationAccount.actions.kick
      const actionsNewValueTransferMats =
        data.actions?.transferMats ??
        automationAccount.actions.transferMats

      if (accountProcess && data.actions) {
        if (
          (!automationAccount.actions.claim && actionsNewValueClaim) ||
          (!automationAccount.actions.kick && actionsNewValueKick) ||
          (!automationAccount.actions.transferMats &&
            actionsNewValueTransferMats)
        ) {
          if (!accountProcess.startedTracking) {
            accountProcess.setStartedTracking(true)
            accountProcess.checkMatchAtStartUp()
          }
        } else if (!actionsNewValueClaim && !actionsNewValueKick) {
          accountProcess.setStartedTracking(false)
          accountProcess.clearMissionIntervalId()
        }
      }

      Automation._accounts.set(accountId, {
        accountId,
        actions: {
          claim: actionsNewValueClaim,
          kick: actionsNewValueKick,
          transferMats: actionsNewValueTransferMats,
        },
        status: data.status ?? automationAccount.status,
      })
    }
  }
}
