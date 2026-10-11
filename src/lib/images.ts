// src/lib/images.ts
import heroImg from '@/assets/hero.jpg';
import exteriorImg from '@/assets/exterior.jpg';
import living1 from '@/assets/living-1.jpg';
import living2 from '@/assets/living-2.jpg';
import living3 from '@/assets/living-3.jpg';
import bathroom1 from '@/assets/bathrooms1.jpg';
import bathroom2 from '@/assets/bathrooms2.jpg';
import bathroom3 from '@/assets/bathrooms3.jpg';
import bathroom4 from '@/assets/bathrooms4.jpg';
import recreation1 from '@/assets/recreation1.jpg';
import recreation2 from '@/assets/recreation2.jpg';
import recreation3 from '@/assets/recreation3.jpg';
import bedroom1 from '@/assets/bedrooms1.jpg';
import bedroom2 from '@/assets/bedrooms2.jpg';
import kitchen1 from '@/assets/kitchens1.jpg';

export const GALLERY_IMAGES = {
  hero: heroImg,
  exterior: exteriorImg,

  livingRoom: [
    living1,
    living2,
    living3,
    // Remote placeholders
    'https://images.pexels.com/photos/6585598/pexels-photo-6585598.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/8135496/pexels-photo-8135496.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/6920439/pexels-photo-6920439.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/7546323/pexels-photo-7546323.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],

  bedrooms: [
    bathroom1,
    bathroom2,
    bathroom3,
    bathroom4,
    'https://images.pexels.com/photos/6434592/pexels-photo-6434592.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],

  kitchens: [
    kitchen1,
    'https://images.pexels.com/photos/7195739/pexels-photo-7195739.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/6265836/pexels-photo-6265836.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/7166942/pexels-photo-7166942.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],

  bathrooms: [
      bedroom1,
    bedroom2,
  ],

  recreation: [
     recreation1,
    recreation2,
    recreation3,
    'https://images.pexels.com/photos/13036107/pexels-photo-13036107.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],
};

export const ALL_GALLERY = [
  ...GALLERY_IMAGES.livingRoom,
  ...GALLERY_IMAGES.bedrooms,
  ...GALLERY_IMAGES.kitchens,
  ...GALLERY_IMAGES.bathrooms,
  ...GALLERY_IMAGES.recreation,
];