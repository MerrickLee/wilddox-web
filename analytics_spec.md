# Wilddox Analytics Specification

## Environment Constraints
- **Production GA4 ID:** `G-N7SPTBH1C4`
- **Condition:** Events are dispatched to GA4 ONLY when `window.location.hostname` is `wilddox.com` or `www.wilddox.com`. 
- **Privacy:** Names, emails, and raw error messages are scrubbed. A standard `build_version` is attached to all events.

## Event Inventory

| Event Name | Trigger | Parameters | Deduplication | Key Event | Notes |
|:---|:---|:---|:---|:---|:---|
| `entry_screen_view` | Initial load of the Title Screen. | `build_version` | Once per session. | No | Replaces initial automatic pageview. |
| `play_clicked` | Player taps "PLAY WILDDOX" on the title screen. | `build_version` | Once per setup. | No | |
| `new_game_selected` | Player confirms character selection for a new game. | `build_version` | Once per setup. | No | |
| `character_selected` | Player confirms a character from CharacterScreen. | `character_id`, `build_version` | Once per setup. | No | |
| `game_start` | A playable game state initializes. | `name`, `emoji`, `jacket`, `starter`, `level`, `coins` | Once per session. | **Yes** | Does not fire on title screen load. |
| `session_resume` | A returning player successfully loads a valid save. | `build_version` | Once per session. | No | |
| `tutorial_step_completed` | Player completes a specific tutorial milestone. | `step_id`, `step_number`, `character_id` | Once per milestone. | No | Milestones: find_animal, use_move, catch_animal |
| `battle_start` | Player encounters a wild animal or Hunter. | `enemy_name`, `enemy_level` | N/A | No | |
| `battle_move` | Player uses a move in battle. | `move_name` | N/A | No | |
| `battle_win` | Player defeats an enemy or Hunter. | `enemy_name` | N/A | No | |
| `battle_loss` | Player is defeated and retreats. | `enemy_name` | N/A | No | |
| `first_battle_win` | Player achieves their first battle win. | `enemy_name` | **Once per save** | No | Saved durably in `flags.firstBattleWin`. |
| `catch_attempt` | Player throws a cage. | `cage_type`, `enemy_name` | N/A | No | |
| `catch_success` | Player successfully captures an animal. | `enemy_name` | N/A | **Yes** | |
| `first_catch_success` | Player's first successful capture. | `enemy_name` | **Once per save** | No | Saved durably in `flags.firstCatchSuccess`. |
| `quest_complete` | Player completes a quest. | `quest_title` | N/A | **Yes** | |
| `first_quest_complete` | Player completes their first quest. | `quest_title` | **Once per save** | No | Saved durably in `flags.firstQuestComplete`. |
| `player_levelup` | Player levels up. | `new_level` | N/A | **Yes** | |
| `daily_objective_completed` | Player satisfies the Daily Objective. | `objective_id` | Once per day. | No | |
| `daily_reward_claimed` | Player receives the reward for the Daily Objective. | `reward` | Once per day. | No | |

## Save Schema Changes & Migration
To support robust event deduplication and the daily objective, the `wilddox_save_v1` local storage object has been extended to track the following inside the `flags` object:
- `firstBattleWin` (boolean)
- `firstCatchSuccess` (boolean)
- `firstQuestComplete` (boolean)
- `tutorialStep` (integer: 1-4, -1 if migrated legacy save)
- `lastPlayedDate` (string, standard date)
- `dailyObjectiveDone` (boolean)
- `dailyWins` (integer)

Legacy saves missing these fields will automatically map `tutorialStep: -1` on load to skip the forced tutorial for returning players, and initialize the daily objective tracking normally.
