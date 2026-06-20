import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function VendorSuccess() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: '#FEF2F2' }}
        >
          <Text style={{ fontSize: 40 }}>🎉</Text>
        </View>

        <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
          You're almost live!
        </Text>
        <Text className="text-gray-500 text-center text-base leading-6">
          We'll review your store details and activate your account. Usually takes less than 24 hours.
        </Text>

        <TouchableOpacity
          onPress={() => router.replace('/' as any)}
          className="mt-10 w-full py-4 bg-accent rounded-2xl items-center"
          activeOpacity={0.85}
        >
          <Text className="text-white font-semibold text-base">Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}