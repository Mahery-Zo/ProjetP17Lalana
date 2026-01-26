<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Login - Projet Cloud</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-item>
        <ion-label position="floating">Email</ion-label>
        <ion-input v-model="email" type="email" required></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="floating">Mot de passe</ion-label>
        <ion-input v-model="password" type="password" required></ion-input>
      </ion-item>
      <ion-button expand="block" @click="handleLogin" :disabled="loading">
        Se connecter
      </ion-button>
      <ion-toast
        :is-open="showToast"
        message="Erreur de connexion : {{ errorMessage }}"
        duration="3000"
        position="bottom"
        @didDismiss="showToast = false"
      ></ion-toast>
      <ion-loading :is-open="loading" message="Connexion en cours..."></ion-loading>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonToast, IonLoading } from '@ionic/vue';
import { login } from '@/services/firebaseService';  // Importe ta fonction login

const email = ref('');
const password = ref('');
const loading = ref(false);
const showToast = ref(false);
const errorMessage = ref('');
const router = useRouter();

const handleLogin = async () => {
  loading.value = true;
  try {
    await login(email.value, password.value);
    router.push('/home');  // Redirige vers home après succès
  } catch (error: any) {
    errorMessage.value = getErrorMessage(error.code);  // Gestion erreurs Firebase
    showToast.value = true;
  } finally {
    loading.value = false;
  }
};

// Fonction pour mapper erreurs Firebase à messages user-friendly
const getErrorMessage = (code: string) => {
  switch (code) {
    case 'auth/invalid-email':
      return 'Email invalide.';
    case 'auth/user-disabled':
      return 'Compte désactivé.';
    case 'auth/user-not-found':
      return 'Utilisateur non trouvé.';
    case 'auth/wrong-password':
      return 'Mot de passe incorrect.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessayez plus tard.';
    default:
      return 'Erreur inconnue. Vérifiez votre connexion.';
  }
};
</script>