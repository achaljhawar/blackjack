Name: Achal Jhawar

Email: achaljhawar03@gmail.com

deployment_url: https://blackjack-mac.vercel.app/

demo:



https://github.com/user-attachments/assets/07cb65e6-9bbb-44c1-ab87-0c79c74b252e



Assumptions: 
- dealer hits on soft 17 (Ace+6)
- a game can have only 3 end results (win, lose or push/tie)
- rest all rules are followed as per the guidelines

## Setup 

### Clone repo
```bash
$ git clone git@github.com:achaljhawar/blackjack.git
$ cd blackjack
```

### Install dependencies
```
bun add .
```

### Enviormental Variables

```
AUTH_SECRET=""

# Next Auth Google Provider
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# Next Auth Discord Provider
AUTH_DISCORD_ID=""
AUTH_DISCORD_SECRET=""

# Drizzle - Supabase Database
SUPABASE_DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Google Gemini API
GEMINI_API_KEY=""
```

### Database Setup

```
bun db:migrate
```

### RUN now

```
bun dev
```
