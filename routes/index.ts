import { PrismaClient } from "@prisma/client";
//
const client = new PrismaClient();

export default () => {
    return {
        users: 'client.user.findMany()'
    }
}
