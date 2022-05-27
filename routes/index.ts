import { prisma } from "../../db.js";


export default () => {
    return {
        prisma: typeof prisma.user, // To prevent possible tree-shaking
        // foo:1,
        users: 'client.user.findMany()',
    };
}
