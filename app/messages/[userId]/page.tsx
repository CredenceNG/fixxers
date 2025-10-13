import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardButton } from '@/components/DashboardLayout';
import { ConversationView } from './ConversationView';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { userId } = await params;

  // Fetch the other user
  const otherUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!otherUser) {
    notFound();
  }

  // Fetch all messages in this conversation
  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: user.id, recipientId: userId },
        { senderId: userId, recipientId: user.id },
      ],
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      gig: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      order: {
        select: {
          id: true,
          gig: { select: { title: true, slug: true } },
          request: { select: { title: true } },
        },
      },
      request: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Mark messages as read
  await prisma.directMessage.updateMany({
    where: {
      senderId: userId,
      recipientId: user.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return (
    <DashboardLayoutWithHeader
      title={`Conversation with ${otherUser.name || otherUser.email}`}
      subtitle={`${otherUser.role}`}
      actions={
        <DashboardButton variant="outline" href="/messages">
          ← Back to Messages
        </DashboardButton>
      }
    >
      <ConversationView
        currentUserId={user.id}
        otherUserId={otherUser.id}
        otherUserName={otherUser.name || otherUser.email || 'User'}
        messages={messages}
      />
    </DashboardLayoutWithHeader>
  );
}
