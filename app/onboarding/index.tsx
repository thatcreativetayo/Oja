import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

const roles = [
  {
    id: 'vendor',
    title: 'Vendor',
    description: 'List your products and reach nearby customers',
    icon: '🛍️',
    route: '/onboarding/vendor/step1',
  },
  {
    id: 'rider',
    title: 'Rider',
    description: 'Deliver orders and earn within Redemption City',
    icon: '🏍️',
    route: '/onboarding/rider/step1',
  },
  {
    id: 'buyer',
    title: 'Buyer',
    description: 'Shop from local vendors and get it delivered',
    icon: '🛒',
    route: '/onboarding/buyer/step1',
  },
];

export default function RoleSelection() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View className="flex-1 px-6 py-20">
        <View className="mb-10">
          {/* <Text className="text-3xl font-bold text-gray-900">Join Oja</Text> */}
          <Text className="text-black font-heading text-2xl text-center mt-2 leading-6">
            How do you want to use Oja?
          </Text>
        </View>

        <View className='py-20 font-sans px-10'>
          <View className="gap-4">
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              onPress={() => router.push(role.route as any)}
              activeOpacity={0.7}
              style={{
                borderColor: "#00000010",
                padding: 5
              }}
              className="flex-row items-center p-5 rounded-2xl border border-gray-100 bg-gray-50"
            >
              <Text style={{ fontSize: 32 }} className="px-4 w-28">{role.icon}</Text>
              <View className="flex-1">
                <Text className="text-base font-heading px-4 font-semibold text-gray-900">{role.title}</Text>
                <Text className="text-sm font-sans text-gray-500 mt-0.5 leading-5">{role.description}</Text>
              </View>
              <Text style={{ fontSize: 20, color: '#9CA3AF' }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
        </View>

        <Text className="text-center font-sans text-xs text-gray-400 mt-auto mb-8">
          Already have an account?{' '}
          <Text
            className="font-semibold text-accent"
            onPress={() => router.replace('/' as any)}
          >
            Sign in
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}