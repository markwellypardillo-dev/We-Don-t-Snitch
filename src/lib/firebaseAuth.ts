import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const AUTHORIZED_ADMIN_EMAILS = [
  'pmarkwelly@gmail.com',
  'tmsi20200048.bobihis@gmail.com',
  'carxhyperspeedlegend@gmail.com',
  'ggmaybisaya@gmail.com',
  'rockhardmiso@gmail.com',
  'nunoocpm680@gmail.com',
  'vinsinitykamidsa@gmail.com'
];

export async function loginAdmin(email: string, pass: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      // For initial setup, create the admin user if they are an authorized admin
      if (AUTHORIZED_ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
         try {
           const newUser = await createUserWithEmailAndPassword(auth, email.trim(), pass);
           return { success: true, user: newUser.user };
         } catch (createError: any) {
           return { success: false, error: createError.message };
         }
      }
    }
    return { success: false, error: error.message };
  }
}

export async function logoutAdmin() {
  await auth.signOut();
}
