import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/components/ui';

export default function RootLayout() {
  return <>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="expenses/index" options={{ title: '消费管理' }} />
      <Stack.Screen name="expenses/form" options={{ title: '记一笔' }} />
      <Stack.Screen name="expenses/stats" options={{ title: '支出统计' }} />
      <Stack.Screen name="expenses/categories" options={{ title: '分类管理' }} />
      <Stack.Screen name="health/index" options={{ title: '健康管理' }} />
      <Stack.Screen name="health/meal" options={{ title: '饮食记录' }} />
      <Stack.Screen name="health/weight" options={{ title: '体重记录' }} />
      <Stack.Screen name="health/export" options={{ title: '健康导出' }} />
      <Stack.Screen name="settings" options={{ title: '设置与备份' }} />
    </Stack>
  </>;
}
