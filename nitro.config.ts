import { defineNitroConfig } from 'nitropack'

export default defineNitroConfig({
    rollupConfig: {
        external: [
            '@prisma/client'
        ]
    }
})
