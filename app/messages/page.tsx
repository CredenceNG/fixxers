import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard } from '@/components/DashboardLayout';
import { ConversationList } from './ConversationList';

export default async function MessagesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch all direct messages where user is sender or recipient
  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: user.id },
        { recipientId: user.id },
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
      recipient: {
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
          gig: { select: { title: true } },
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
      createdAt: 'desc',
    },
  });

  // Group messages by conversation (other user)
  const conversationsMap = new Map<string, typeof messages>();

  messages.forEach((message) => {
    const otherUserId = message.senderId === user.id ? message.recipientId : message.senderId;

    if (!conversationsMap.has(otherUserId)) {
      conversationsMap.set(otherUserId, []);
    }
    conversationsMap.get(otherUserId)!.push(message);
  });

  const conversations = Array.from(conversationsMap.entries()).map(([otherUserId, msgs]) => {
    const latestMessage = msgs[0];
    const otherUser = latestMessage.senderId === user.id ? latestMessage.recipient : latestMessage.sender;
    const unreadCount = msgs.filter((m) => m.recipientId === user.id && !m.isRead).length;

    return {
      otherUserId,
      otherUser,
      messages: msgs,
      latestMessage,
      unreadCount,
    };
  });

  // Sort by latest message
  conversations.sort((a, b) =>
    new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime()
  );

  return (
    <DashboardLayoutWithHeader
      title="Messages"
      subtitle="Your conversations"
    >
      <DashboardCard padding="0">
        <ConversationList conversations={conversations} currentUserId={user.id} />
      </DashboardCard>
    </DashboardLayoutWithHeader>
  );
}
