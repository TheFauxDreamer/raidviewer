# Ghost - Guardian Lookup

Ghost is a web interface for tracking Raid and Dungeon completion histories for players across Destiny 1 and Destiny 2. 

It uses the Bungie.net API to search for Guardians, pull their activity logs, and display character-specific or account-wide statistics, including fireteam breakdowns.

---

## Features

* **Unified History:** Combines completion data for both Destiny 1 and Destiny 2 into a single timeline.
* **Activity Badges:** Custom UI tags to highlight specific run types:
  * First Clears (◆)
  * Solo Completions (◆)
  * Solo Flawless (✦)
  * Checkpoint Clears (◈)
* **Character Filtering:** Sort statistics by account-wide totals or individual characters (Titan, Hunter, Warlock).
* **Fireteam Roster:** Expandable activity logs that display the full fireteam, highlighting the searched player and showing individual completion statuses.

---

## Getting Started

### Prerequisites
To run this project fully, you need to register an application with Bungie to obtain an API key for the backend requests.
* [Bungie Developer Portal](https://www.bungie.net/en/Application)

### Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/yourusername/ghost-guardian-lookup.git](https://github.com/yourusername/ghost-guardian-lookup.git)
