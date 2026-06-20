import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function BuyerSuccess() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: '#FEF2F2' }}
        >
          <Text style={{ fontSize: 40 }}>🛒</Text>
        </View>

        <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
          You're all set!
        </Text>
        <Text className="text-gray-500 text-center text-base leading-6">
          Discover local vendors in Redemption City and get your orders delivered right to your door.
        </Text>

        <TouchableOpacity
          onPress={() => router.replace('/' as any)}
          className="mt-10 w-full py-4 rounded-2xl bg-accent items-center"
          activeOpacity={0.85}
        >
          <Text className="text-white font-semibold text-base">Start Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}