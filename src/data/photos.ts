export interface Photo {
  id: number;
  url: string;
  actualDate: string; // Format: "DD/MM/YYYY"
  location: string;
  description?: string;
  message?: string;
  coordinates: [number, number]; // Tuple: [lat, lng]
}

// Stanford coordinates: 37.4275° N, 122.1697° W
export const photos: Photo[] = [
  {
    id: 1,
    url: '/photos/Mini golf.png',
    actualDate: '11/05/2024',
    location: 'Palo Alto, CA',
    message: 'A friendly quarrel between friends over mini golf.',
    coordinates: [37.4254469, -122.1456754]
  },
  {
    id: 2,
    url: '/photos/Dictionary.png',
    actualDate: '19/04/2025',
    location: 'Angel Island, San Francisco',
    message: 'A Greek-English dictionary (apparently).',
    coordinates: [37.8700987, -122.4260346]
  },
  {
    id: 3,
    url: '/photos/Escape.png',
    actualDate: '02/02/2025',
    location: 'Cupertino, CA',
    message: 'A group of escape room professionals who totally escaped on time. (Oh and boba)',
    coordinates: [37.4220587, -122.1710134]
  },
  {
    id: 4,
    url: '/photos/Roble.png',
    actualDate: '07/02/2025',
    location: 'Stanford, CA',
    message: 'An interesting POV for a group photo… and orange chicken!',
    coordinates: [37.424274, -122.1742752]
  },
  {
    id: 5,
    url: '/photos/CAH.png',
    actualDate: '08/04/2025',
    location: 'Stanford, CA',
    message: 'The first and last game of Cards Against Humanity I will ever play.',
    coordinates: [37.4216057, -122.1709561]
  },
  {
    id: 6,
    url: '/photos/CDC.png',
    actualDate: '10/04/2025',
    location: 'San Jose, CA',
    message: 'Not sure what impressed me the most: the show, the water bottle, or the bathrooms.',
    coordinates: [37.3022144, -121.8551814]
  },
  {
    id: 7,
    url: '/photos/Burrito.png',
    actualDate: '03/03/2024',
    location: 'San Jose, CA',
    message: 'I am a photographer in another life.',
    coordinates: [37.332876, -121.8751777]
  },
  {
    id: 8,
    url: '/photos/Turkey.png',
    actualDate: '22/03/2024',
    location: 'Stanford, CA',
    message: 'Why did the turkey cross the road?',
    coordinates: [37.410936, -122.179497]
  },
  {
    id: 9,
    url: '/photos/Chosen One.png',
    actualDate: '12/12/2024',
    location: 'Stanford, CA',
    message: 'THE CHOSEN ONE. Also, check the corner of your paper ;)',
    coordinates: [37.4241123, -122.1711976]
  },
  {
    id: 10,
    url: '/photos/Triangle.png',
    actualDate: '26/01/2025',
    location: 'Stanford, CA',
    message: 'Tri-angel-ina (the pun was as bad as the mocha…)',
    coordinates: [37.4325851, -122.1709527]
  }
]; 