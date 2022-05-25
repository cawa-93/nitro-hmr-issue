# Reproduction for nitro issue

The dev server hangs if connected to a database

Steps:
1. Clone repo and run `npm ci`
2. Run dev server by `npx nitropack dev`
3. Go to http://localhost:3000/. The page is expected to load with response `{"users": "client.user.findMany()"}`. In logs you should see two messages:
   ```
   [PrismaClient] [before] new PrismaClient()
   [PrismaClient] [after] new PrismaClient()
   ```
5. Open `routes/index.ts` and add another property to returned object
6. Go to http://localhost:3000/. The page is expected in infinity loading while you doesn't restart dev server. In logs you should _only one_ messages:
   ```
   [PrismaClient] [before] new PrismaClient()
   ```
   **Note** 
   Sometimes, the first time a developer's server is updated correctly. Then it is necessary to make one more change and already after the second the described error almost always arises
   
