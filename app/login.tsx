import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { registerDevicePushToken } from '@/lib/pushNotifications';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  const { loginWithCredentials } = useApp();
  const [email, setEmail] = useState(isSupabaseConfigured ? '' : 'henrique@connexio.app');
  const [password, setPassword] = useState(isSupabaseConfigured ? '' : 'connexio');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { Alert.alert('Preencha seus dados', 'Informe e-mail e senha para continuar.'); return; }
    setLoading(true);
    try {
      const mode = await loginWithCredentials(email, password);
      if (mode === 'REMOTE') void registerDevicePushToken().catch(() => undefined);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Não foi possível entrar', error instanceof Error ? error.message : 'Confira e-mail e senha.');
    } finally { setLoading(false); }
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.intro}><Text style={styles.title}>Bem-vindo de volta</Text><Text style={styles.subtitle}>Entre para explorar oportunidades da sua rede.</Text></View>
    <View style={styles.form}><FormField label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/><FormField label="Senha" value={password} onChangeText={setPassword} secureTextEntry/><Button label="Entrar no Connexio" loading={loading} onPress={handleLogin}/></View>
    <View style={styles.demoBox}><Text style={styles.demoTitle}>{isSupabaseConfigured?'Acesso conectado':'Ambiente de demonstração'}</Text><Text style={styles.demoText}>{isSupabaseConfigured?'O login carrega perfil, Loja e cargo. No celular, o Connexio também solicita permissão de notificações para comunicados da sua Loja.':'Sem credenciais Supabase, o Connexio mantém o perfil aprovado de demonstração para desenvolvimento.'}</Text></View>
  </Screen>;
}
const styles=StyleSheet.create({content:{paddingTop:18,gap:28},intro:{gap:8},title:{color:colors.cream,fontSize:30,fontWeight:'800'},subtitle:{color:colors.textMuted,fontSize:15,lineHeight:22},form:{gap:18},demoBox:{padding:16,borderRadius:16,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,gap:6},demoTitle:{color:colors.goldSoft,fontSize:13,fontWeight:'800'},demoText:{color:colors.textMuted,fontSize:13,lineHeight:19}});
