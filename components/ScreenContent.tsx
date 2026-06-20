import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Logo from '../assets/logo.svg';

interface ScreenContentProps {
  title: string;
  path: string;
  children?: React.ReactNode;
}

export const ScreenContent: React.FC<ScreenContentProps> = ({ title, path, children }) => {
  return (
    <View className="flex flex-col p-10 py-20 font-sans h-screen justify-between">
      <View className="flex flex-row w-fit justify-center items-center gap-4">
        <View className="w-16 h-1 bg-accent rounded-full"></View>
        <View className="w-16 h-1 bg-accent/20 rounded-full"></View>
        <View className="w-16 h-1 bg-accent/20 rounded-full"></View>
        <View className="w-16 h-1 bg-accent/20 rounded-full"></View>
      </View>
      <View className="items-center justify-center">
        <Logo width={64} height={64} />
      </View>
      
      <View className="flex flex-col items-center text-center gap-2">
        <Text className="text-4xl font-heading text-center">Welcome to Oja!</Text>
        <Text className="text-sm text-black/50 text-center px-6 mb-8">Smart meals made for your taste, time, and wallet. Let’s cook something special.</Text>
        <TouchableOpacity className="bg-accent rounded-full px-5 py-3.5 w-full text-center flex items-center justify-center" onPress={() => {}}>
          <Text className="text-white font-sans font-semibold">Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
