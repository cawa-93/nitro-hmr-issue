const Prisma = require('@prisma/client')
// declare global {
//     var prisma: PrismaClient | undefined;
// }
console.log({NODE_ENV: process.env.NODE_ENV});


console.log('[db.ts] [before] new PrismaClient()', {globalThis: typeof globalThis.prisma});
const prisma =
    globalThis.prisma ||
    new Prisma.PrismaClient({
        log: ['query'],
    });
console.log('[db.ts] [after] new PrismaClient()', {globalThis: typeof globalThis.prisma});

module.exports.prisma = prisma

console.log('[db.ts] [before] globalThis.prisma = prisma', {globalThis: typeof globalThis.prisma});
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
console.log('[db.ts] [after] globalThis.prisma = prisma', {globalThis: typeof globalThis.prisma});
