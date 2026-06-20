// import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import Logo from '../assets/logo.svg';

export default function HomeScreen() {
  const router = useRouter();

  // useEffect(() => {
  //   async function checkOnboarding() {
  //       router.replace('/onboarding' as any);
  //   }
  //   checkOnboarding();
  // }, [router]);

  return (
   <View className="flex flex-col relative p-10 py-20 font-sans h-screen justify-between">
      <View className="flex flex-row w-fit justify-center items-center gap-4">
        <View className="w-16 h-1 bg-accent rounded-full"></View>
        <View className="w-16 h-1 bg-accent/20 rounded-full"></View>
        <View className="w-16 h-1 bg-accent/20 rounded-full"></View>
        <View className="w-16 h-1 bg-accent/20 rounded-full"></View>
      </View>
      <View className=" justify-center">
        <Logo width={44} height={44} />
      </View>
      <View className='h-20 w-screen bg-black'>
        <Text>Yo</Text>
      </View>
      <View className="flex flex-col items-center text-center gap-2">
        <Text className="text-4xl font-heading text-center">Welcome to Oja!</Text>
        <Text className="text-sm text-black/50 text-center px-6 mb-8">Smart meals made for your taste, time, and wallet. Let’s cook something special.</Text>
        <TouchableOpacity
          onPress={() => router.push('/onboarding' as any)}
          className="bg-accent rounded-full px-5 py-3.5 w-full text-center flex items-center justify-center">
          <Text className="text-white font-sans font-semibold">Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}