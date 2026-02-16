'use server';

import { redirect } from 'next/navigation';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword, createSession, deleteSession } from './auth';

export type AuthResult = {
  error?: string;
};

export async function signup(formData: FormData): Promise<AuthResult> {
  const displayName = (formData.get('displayName') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!displayName || !email || !password) {
    return { error: 'Tous les champs sont requis.' };
  }

  if (password.length < 6) {
    return { error: 'Le mot de passe doit contenir au moins 6 caractères.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Les mots de passe ne correspondent pas.' };
  }

  // Check email unique
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) {
    return { error: 'Un compte existe déjà avec cet email.' };
  }

  const passwordHash = await hashPassword(password);

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      displayName,
      passwordHash,
    })
    .returning();

  await createSession(newUser.id, newUser.email);
  redirect('/');
}

export async function login(formData: FormData): Promise<AuthResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email et mot de passe requis.' };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user || !user.passwordHash) {
    return { error: 'Email ou mot de passe incorrect.' };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: 'Email ou mot de passe incorrect.' };
  }

  // Update lastLoginAt
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  await createSession(user.id, user.email);
  redirect('/');
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/login');
}
