const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialiser Firebase Admin
admin.initializeApp();

// Envoyer une notification quand le statut d'un signalement change
exports.onSignalementStatusChange = functions.firestore
  .document('signalements/{signalementId}')
  .onWrite(async (change, context) => {
    const { signalementId } = context.params;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Vérifier si le statut a changé
    if (!beforeData || !afterData || beforeData.status === afterData.status) {
      return null;
    }

    const { userId, status, description } = afterData;
    
    if (!userId) {
      console.log('No userId found, skipping notification');
      return null;
    }

    try {
      // Récupérer les tokens FCM de l'utilisateur
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (!userData || !userData.fcmTokens || userData.fcmTokens.length === 0) {
        console.log('No FCM tokens found for user:', userId);
        return null;
      }

      // Préparer la notification
      const notification = {
        title: 'Mise à jour de votre signalement',
        body: `Le statut de votre signalement est maintenant: ${getStatusText(status)}`,
        data: {
          signalementId: signalementId,
          status: status,
          type: 'signalement_update'
        }
      };

      // Envoyer la notification à tous les tokens de l'utilisateur
      const tokens = userData.fcmTokens;
      const response = await admin.messaging().sendMulticast({
        tokens: tokens,
        notification: notification,
        data: notification.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      });

      console.log('Notification sent successfully:', response);
      
      // Nettoyer les tokens invalides
      if (response.failureCount > 0) {
        const invalidTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            invalidTokens.push(tokens[idx]);
          }
        });
        
        if (invalidTokens.length > 0) {
          const validTokens = tokens.filter(token => !invalidTokens.includes(token));
          await admin.firestore().collection('users').doc(userId).update({
            fcmTokens: validTokens
          });
          console.log('Removed invalid tokens:', invalidTokens);
        }
      }

      return null;

    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  });

// Fonction utilitaire pour obtenir le texte du statut
function getStatusText(status) {
  const statusMap = {
    'nouveau': 'Nouveau',
    'en_cours': 'En cours de traitement',
    'termine': 'Terminé'
  };
  return statusMap[status] || status;
}

// Envoyer une notification quand une entreprise est assignée
exports.onEntrepriseAssigned = functions.firestore
  .document('signalements/{signalementId}')
  .onUpdate(async (change, context) => {
    const { signalementId } = context.params;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Vérifier si une entreprise a été assignée
    if (beforeData.entrepriseId === afterData.entrepriseId || !afterData.entrepriseId) {
      return null;
    }

    const { userId, entrepriseId, entreprise, description } = afterData;
    
    if (!userId) {
      return null;
    }

    try {
      // Récupérer les tokens FCM de l'utilisateur
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (!userData || !userData.fcmTokens || userData.fcmTokens.length === 0) {
        return null;
      }

      // Préparer la notification
      const notification = {
        title: 'Entreprise assignée',
        body: `${entreprise || 'Une entreprise'} a été assignée à votre signalement`,
        data: {
          signalementId: signalementId,
          entrepriseId: entrepriseId,
          type: 'entreprise_assigned'
        }
      };

      // Envoyer la notification
      const response = await admin.messaging().sendMulticast({
        tokens: userData.fcmTokens,
        notification: notification,
        data: notification.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default'
          }
        }
      });

      console.log('Enterprise assignment notification sent:', response);
      return null;

    } catch (error) {
      console.error('Error sending enterprise assignment notification:', error);
      return null;
    }
  });

// Test function pour envoyer des notifications de test
exports.sendTestNotification = functions.https.onCall(async (data, context) => {
  const userId = context.auth?.uid;
  
  if (!userId) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData || !userData.fcmTokens || userData.fcmTokens.length === 0) {
      throw new functions.https.HttpsError('not-found', 'No FCM tokens found');
    }

    const notification = {
      title: 'Notification de test',
      body: 'Ceci est une notification de test pour vérifier que tout fonctionne!',
      data: {
        type: 'test_notification'
      }
    };

    const response = await admin.messaging().sendMulticast({
      tokens: userData.fcmTokens,
      notification: notification,
      data: notification.data
    });

    return {
      success: true,
      message: 'Test notification sent',
      response: response
    };

  } catch (error) {
    console.error('Error sending test notification:', error);
    throw new functions.https.HttpsError('internal', 'Error sending test notification');
  }
});
