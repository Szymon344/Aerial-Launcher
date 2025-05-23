import { StringUnion } from '../../utils.d'

type ProfileId = StringUnion<'campaign' | 'common_core'>

export type MCPQueryProfile = {
  profileRevision: number
  profileId: 'campaign'
  profileChangesBaseRevision: number
  profileCommandRevision: number
  serverTime: string
  responseVersion: number
  profileChanges: Array<MCPQueryProfileChanges>
}

export type MCPQueryProfileChanges = {
  changeType: StringUnion<'fullProfileUpdate'>
  profile: {
    _id: string
    created: string
    updated: string
    rvn: number
    wipeNumber: number
    accountId: string
    profileId: ProfileId
    version: string
    commandRevision: number
    stats: {
      attributes: {
        node_costs?: {
          homebase_node_default_page: {
            'Token:homebasepoints': number
          }
          research_node_default_page: {
            'Token:collectionresource_nodegatetoken01': number
          }
        }
        mission_alert_redemption_record?: Partial<{
          claimData: Array<{
            missionAlertId: string
            evictClaimDataAfterUtc: string
            redemptionDateUtc: string
          }>
          lastClaimTimesMap: unknown
          lastClaimedGuidPerTheater: unknown
          pendingMissionAlertRewards: {
            tierGroupName: StringUnion<'MissionAlert_Storm:4'>
            items: Array<{
              itemType: string
              quantity: number
            }>
          }
        }>
        rewards_claimed_post_max_level?: number
        client_settings?: {
          pinnedQuestInstances: Array<string>
        }
        research_levels?: {
          technology: number
          offense: number
          fortitude: number
          resistance: number
        }
        selected_hero_loadout?: string
        level: number
        xp_overflow?: number
        collection_book?: {
          maxBookXpLevelAchieved: number
        }
        latent_xp_marker?: string
        mfa_reward_claimed?: boolean
        quest_manager: {
          dailyLoginInterval: string
          dailyQuestRerolls: number
          questPoolStats?: {
            dailyLoginInterval: string
            poolLockouts: {
              poolLockouts: Array<{
                lockoutName: StringUnion<'EnduranceDaily' | 'Weekly'>
              }>
            }
            poolStats: Array<{
              questHistory: Array<string>
              rerollsRemaining: number
              nextRefresh: string
              poolName: StringUnion<
                | 'dailywargamescanny_01'
                | 'dailywargameschallenge_01'
                | 'dailywargamesplankerton_01'
                | 'dailywargamesstonewood_01'
                | 'dailywargamestwine_01'
                | 'endurancedailyquests_15'
                | 'holdfastdaily_part1_01'
                | 'holdfastdaily_part2_01'
                | 'hordev3dailyquests_01'
                | 'maydaydailyquest_01'
                | 'starlightdailyquest_01'
                | 'stormkingdailyquest_01'
                | 'weeklyelderquestroll_01'
                | 'weeklyquestroll_23'
                | 'weeklystormkinghardroll_01'
              >
            }>
          }
        }
        legacy_research_points_spent?: number
        gameplay_stats?: Array<{
          statName: StringUnion<'habaneroprogression' | 'zonescompleted'>
          statValue: number
        }>
        event_currency?: {
          cf: number
          templateId: StringUnion<
            | 'AccountResource:eventcurrency_lunar'
            | 'AccountResource:eventcurrency_adventure'
            | 'AccountResource:eventcurrency_roadtrip'
            | 'AccountResource:eventcurrency_candy'
            | 'AccountResource:eventcurrency_snowballs'
          >
        }
        matches_played?: number
        xp_lost?: number
        mode_loadouts?: Array<unknown>
        unslot_mtx_spend?: number
        daily_rewards?: {
          nextDefaultReward: number
          totalDaysLoggedIn: number
          lastClaimDate: string
          additionalSchedules: {
            founderspackdailyrewardtoken: {
              rewardsClaimed: number
              claimedToday: boolean
            }
          }
        }
        xp?: number
        quest_completion_session_ids?: Record<string, string>
        difficulty_increase_rewards_record?: {
          pendingRewards: Array<{
            difficultyIncreaseMissionRewards: {
              tierGroupName: StringUnion<'BluGloDifficultyTG:4'>
              items: Array<{
                itemType: string
                quantity: number
              }>
            }
            difficultyIncreaseTier: number
          }>
        }
        packs_granted?: number
      }
    }
    items: Record<
      string,
      | MCPQueryProfileProfileChangesCardPack
      | MCPQueryProfileProfileChangesConsumableAccountItem
      | MCPQueryProfileProfileChangesHero
      | MCPQueryProfileProfileChangesSchematic
      | MCPQueryProfileProfileChangesToken
      | MCPQueryProfileProfileChangesQuest
      | MCPQueryProfileProfileChangesWorker
    >
  }
}

export type MCPQueryProfileProfileChangesAccountResource = {
  templateId: `AccountResource:${string}`
  attributes: {
    level: number
    item_seen: boolean
  }
  quantity: 1480
}

export type MCPQueryProfileProfileChangesCardPack = {
  templateId: `CardPack:${string}`
  attributes: {
    match_statistics?: {
      mission_name: string
      total_seconds_in_match: number
      matchmaking_session_id: string
      eligibility_status: StringUnion<'None'>
    }
    level: number
    pack_source: StringUnion<'ItemCache'>
  }
  quantity: number
}

export type MCPQueryProfileProfileChangesConsumableAccountItem = {
  templateId: `ConsumableAccountItem:${string}`
  attributes: {
    level: number
    item_seen: boolean
  }
  quantity: number
}

export type MCPQueryProfileProfileChangesHero = {
  templateId: `Hero:${string}`
  attributes: {
    hero_name: StringUnion<'DefaultHeroName'>
    level: number
    item_seen: boolean
    squad_slot_idx: number
    building_slot_used: number
    favorite?: boolean
    max_level_bonus?: number
    refundable?: boolean
    outfitvariants?: Array<{
      channel: StringUnion<'Parts'>
      active: StringUnion<
        'CampaignHero.Tier2.Legendary' | 'CampaignHero.Tier3.Legendary'
      >
    }>
    backblingvariants?: Array<{
      channel: StringUnion<'Parts'>
      active: StringUnion<
        'CampaignHero.Tier2.Legendary' | 'CampaignHero.Tier3.Legendary'
      >
    }>
    mode_loadouts?: Array<unknown>
  }
  quantity: number
}

export type MCPQueryProfileProfileChangesQuest = {
  templateId: `Quest:${string}`
  attributes: {
    quest_state: StringUnion<'Active' | 'Claimed' | 'Completed'>
    creation_time: StringUnion<'min'>
    last_state_change_time: string
    level: number
    item_seen: boolean
    sent_new_notification: boolean
    quest_rarity: StringUnion<'uncommon'>
    xp_reward_scalar: number
  }
  quantity: number
}

export type MCPQueryProfileProfileChangesSchematic = {
  templateId: `Schematic:${string}`
  attributes: {
    level: number
    max_level_bonus?: number
    item_seen: boolean
    favorite?: boolean
    alterations: Array<StringUnion<`Alteration:${string}`>>
    alteration_base_rarities?: Array<
      StringUnion<'common' | 'uncommon' | 'rare'>
    >
    refund_legacy_item?: boolean
  }
  quantity: number
}

export type MCPQueryProfileProfileChangesToken = {
  templateId: `Token:${string}`
  attributes: {
    level: number
  }
  quantity: number
}

export type MCPQueryProfileProfileChangesWorker = {
  templateId: `Worker:${string}`
  attributes: {
    personality: 'string'
    gender?: StringUnion<'1' | '2'>
    level: number
    max_level_bonus?: number
    favorite?: boolean
    item_seen: boolean
    squad_id?: string
    squad_slot_idx: number
    portrait: string
    building_slot_used: number
    set_bonus?: string
    managerSynergy?: string
  }
  quantity: number
}

export type MCPQueryProfileProfileChangesPrerollData = {
  templateId: `PrerollData:${string}`
  attributes: {
    fulfillmentId: string
    expended_streakbreakers: Record<string, unknown>
    level: number
    highest_rarity: number
    offerId: string
    expiration: string
    items: Array<
      | {
          itemType: `Schematic:${string}`
          attributes?: {
            Alteration: {
              LootTierGroup: string
              Tier: number
            }
            alterations: Array<string>
          }
          quantity: number
        }
      | {
          itemType: string
          attributes: Record<string, unknown>
          quantity: number
        }
    >
  }
  quantity: number
}
