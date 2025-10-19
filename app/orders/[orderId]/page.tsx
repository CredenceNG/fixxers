import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function OrderRedirectPage({ params }: { params: Promise<{ orderId: string }> }) {
    const resolvedParams = await params;
    const { orderId } = resolvedParams;

    // Require auth - if user not signed in, send to login
    const user = await getCurrentUser();
    if (!user) {
        redirect('/auth/login');
    }

    // Load order minimal fields
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, clientId: true, fixerId: true },
    });

    if (!order) {
        notFound();
    }

    // Admins can view via admin area
    const roles = user.roles || [];
    if (roles.includes('ADMIN')) {
        redirect(`/admin/orders/${orderId}`);
    }

    // Redirect to fixer or client view depending on ownership
    if (user.id === order.fixerId) {
        redirect(`/fixer/orders/${orderId}`);
    }

    if (user.id === order.clientId) {
        redirect(`/client/orders/${orderId}`);
    }

    // Not the owner - redirect to a safe place
    redirect('/');
}
