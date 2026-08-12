import { Card, CardContent } from '@/components/ui/card';
import { Store, Users, MapPin, Heart } from 'lucide-react';
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50"><div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12"><h1 className="text-3xl font-bold mb-4">About LocalMart</h1><p className="text-lg text-gray-600 max-w-2xl mx-auto">Connecting local businesses with their communities. All local shops in one place.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {[{ icon: Store, title: 'Local First', desc: 'Supporting small businesses and local entrepreneurs across Bangladesh.' }, { icon: MapPin, title: 'Location-Based', desc: 'Discover shops and products near you with our geolocation technology.' }, { icon: Users, title: 'Community', desc: 'Building stronger communities by connecting neighbors with local shops.' }, { icon: Heart, title: 'Trust', desc: 'Verified sellers, secure payments, and reliable delivery you can count on.' }].map(item => (
          <Card key={item.title}><CardContent className="p-6 text-center"><item.icon className="w-10 h-10 text-green-600 mx-auto mb-3" /><h3 className="font-bold text-lg mb-2">{item.title}</h3><p className="text-gray-600">{item.desc}</p></CardContent></Card>
        ))}
      </div>
    </div></div>
  );
}
