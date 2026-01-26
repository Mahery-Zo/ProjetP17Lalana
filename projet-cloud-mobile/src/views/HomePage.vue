<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Accueil - Carte et Récap</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Bienvenue ! Ici viendra la carte OSM et le récap des signalements.</p>
      <ion-button expand="block" @click="handleLogout">Déconnexion</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { logout as firebaseLogout } from '@/services/firebaseService';

const router = useRouter();

const handleLogout = async () => {
  await firebaseLogout();
  router.push('/login');
};
</script>