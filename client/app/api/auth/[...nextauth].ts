import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

// Khởi tạo PrismaClient
const prisma = new PrismaClient();

// Định nghĩa kiểu cho user trả về từ authorize
interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

// Cấu hình NextAuth với TypeScript
export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        // Kiểm tra credentials có tồn tại không
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        // Tìm user trong database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("No user found");
        }

        // So sánh mật khẩu
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid password");
        }

        // Trả về object user với các thuộc tính cần thiết
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Nếu có user (sau khi đăng nhập thành công), thêm thông tin vào token
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Thêm thông tin từ token vào session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
} as NextAuthOptions);