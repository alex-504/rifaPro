import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Função de teste simples
export const helloWorld = functions.https.onCall(async () => ({
  message: "Hello World!",
}));

// Função para criar usuários sem afetar a sessão do admin
export const createUser = functions.https.onCall(async (data, context) => {
  // Verificar se o usuário está autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  // Verificar se o usuário tem permissão (admin ou client_admin)
  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Usuário não encontrado');
  }

  const callerData = callerDoc.data();
  const allowedRoles = ['app_admin', 'client_admin'];
  
  if (!callerData || !allowedRoles.includes(callerData.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Permissão negada');
  }

  try {
    // Criar usuário no Firebase Auth usando Admin SDK
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
    });

    // Criar documento do usuário no Firestore
    const userData = {
      name: data.name,
      email: data.email,
      role: data.role,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(data.clientId && { clientId: data.clientId }),
    };

    await admin.firestore().collection('users').doc(userRecord.uid).set(userData);

    return {
      success: true,
      userId: userRecord.uid,
      message: 'Usuário criado com sucesso!',
    };
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'Este email já está sendo usado');
    } else if (error.code === 'auth/weak-password') {
      throw new functions.https.HttpsError('invalid-argument', 'A senha deve ter pelo menos 6 caracteres');
    } else {
      throw new functions.https.HttpsError('internal', 'Erro interno do servidor');
    }
  }
});
