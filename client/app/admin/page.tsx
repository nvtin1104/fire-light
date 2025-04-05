import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]"; // Điều chỉnh đường dẫn
import { PrismaClient, Post, User } from "@prisma/client";
import { redirect } from "next/navigation";

// Chỉ định route là dynamic
export const dynamic = "force-dynamic";

// Khởi tạo PrismaClient
const prisma = new PrismaClient();

// Định nghĩa kiểu cho Post bao gồm author
interface PostWithAuthor extends Post {
  author: User;
}

// Server Component
export default async function Admin() {
  // Lấy session từ server
  const session = await getServerSession(authOptions);

  // Kiểm tra session và role
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/signin");
  }

  // Lấy danh sách bài viết từ Prisma
  const posts = await prisma.post.findMany({
    include: { author: true },
  });

  return (
    <div>
      <h1>Admin - Quản lý Blog</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}