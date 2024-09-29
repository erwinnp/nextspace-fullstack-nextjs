"use server";

import { usersTable } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { lucia } from "@/lib/lucia";
import { signUpSchema, TSignUpValues } from "@/types/form-schema";
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { generateIdFromEntropySize } from "lucia";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signUpUser(
  credentials: TSignUpValues
): Promise<{ error: string }> {
  try {
    const { username, email, password } = signUpSchema.parse(credentials);

    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    const userId = generateIdFromEntropySize(10);

    const existingUsername = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));

    if (existingUsername.length > 0) {
      return {
        error: "Username already taken",
      };
    }

    const existingEmail = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (existingEmail.length > 0) {
      return {
        error: "Email already taken",
      };
    }

    await db.insert(usersTable).values({
      id: userId,
      username: username,
      email: email,
      password_hash: passwordHash,
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
    return {
      error: "Something went wrong. Please try again.",
    };
  }
}
