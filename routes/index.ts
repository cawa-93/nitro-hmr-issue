import { prisma } from "../db";


export default () => {
    return {
        prisma: typeof prisma.user, // To prevent possible tree-shaking
        users: 'client.user.findMany()',
    };
}
