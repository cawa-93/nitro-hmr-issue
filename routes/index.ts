import { PrismaClient } from "@prisma/client";
//
console.log('[PrismaClient] [before] new PrismaClient()');
const client = new PrismaClient();
console.log('[PrismaClient] [after] new PrismaClient()');

export default () => {
    return {
        users: 'client.user.findMany()',
    };
}
