import Inbox from "@/components/admin/Inbox";
import { PageHeader } from "@/components/admin/ui";
import { connectDB, serialize } from "@/lib/db";
import { Message, Subscriber } from "@/lib/models";

export const metadata = { title: "Inbox" };

export default async function MessagesAdmin() {
  await connectDB();
  const [messages, subscribers] = await Promise.all([Message.find().sort({ createdAt: -1 }).limit(200).lean(), Subscriber.find().sort({ createdAt: -1 }).lean()]);
  return (
    <>
      <PageHeader title="Inbox" subtitle="Contact form messages and newsletter subscribers." />
      <Inbox messages={serialize(messages)} subscribers={serialize(subscribers)} />
    </>
  );
}
