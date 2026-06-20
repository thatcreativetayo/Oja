import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function RiderSuccess() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: '#FEF2F2' }}
        >
          <Text style={{ fontSize: 40 }}>🏍️</Text>
        </View>

        <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
          Application submitted!
        </Text>
        <Text className="text-gray-500 text-center text-base leading-6">
          We'll verify your details and activate your rider account. You'll get a notification once you're approved.
        </Text>

        <TouchableOpacity
          onPress={() => router.replace('/' as any)}
          className="mt-10 w-full py-4 rounded-2xl bg-accent items-center"
          activeOpacity={0.85}
        >
          <Text className="text-white font-semibold text-base">Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}