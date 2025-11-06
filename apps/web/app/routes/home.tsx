import { Welcome } from '../welcome/welcome';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Tabiheim Games' },
    { name: 'description', content: 'Welcome to Tabiheim Games!' },
  ];
}

export default function Home() {
  return <Welcome message="Welcome to Tabiheim Games! 🎮" />;
}
