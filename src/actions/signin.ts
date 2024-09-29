"use server";
import { usersTable } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { lucia } from "@/lib/lucia";
import { signInSchema, TSignInValues } from "@/types/form-schema";
import { verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signInUser(
  credentials: TSignInValues
): Promise<{ error: string }> {
  try {
    const { email, password } = signInSchema.parse(credentials);

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    console.log(existingUser);

    if (existingUser.length === 0 || !existingUser[0].password_hash) {
      return {
        error: "Incorrect email or password",
      };
    }

    const validPassword = await verify(
      existingUser[0].password_hash,
      password,
      {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      }
    );

    if (!validPassword) {
      return {
        error: "Incorrect email or password",
      };
    }

    const session = await lucia.createSession(existingUser[0].id, {});
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
