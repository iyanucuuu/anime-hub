import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { environment } from '../environments/environment';

const app = getApps().length ? getApps()[0] : initializeApp(environment.firebase);

export const db = getFirestore(app);
export const auth = getAuth(app);
