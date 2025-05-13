import { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Image,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Flex,
  Progress,
  useColorModeValue,
  IconButton,
} from '@chakra-ui/react';
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline, useMap, Popup } from 'react-leaflet';
import type { LeafletMouseEvent, LeafletEvent } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { differenceInDays, addDays, format } from 'date-fns';
import { photos } from '../data/photos';
import type { Photo } from '../data/photos';
import { useCustomToast } from '../hooks/useCustomToast';
import React from 'react';
import { keyframes } from '@emotion/react';

interface GameState {
  currentPhotoIndex: number;
  score: number;
  guesses: number[];
}

interface LocationGuess {
  lat: number;
  lng: number;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const START_DATE = new Date('2023-09-01');
const END_DATE = new Date(); // Today
const TOTAL_DAYS = differenceInDays(END_DATE, START_DATE);
const TOTAL_ROUNDS = 10;

// Stanford coordinates
const STANFORD_COORDINATES: LocationGuess = {
  lat: 37.4275,
  lng: -122.1697,
};

// Helper function to parse dd/MM/yyyy dates
const parseDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

// Helper function to format date as dd/MM/yyyy
const formatDate = (date: Date): string => {
  return format(date, 'dd/MM/yyyy');
};

// Helper function to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function LocationPicker({ locationGuess, setLocationGuess, setHasPlacedPin }: { locationGuess: LocationGuess, setLocationGuess: (loc: LocationGuess) => void, setHasPlacedPin: (placed: boolean) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      setLocationGuess({ lat: e.latlng.lat, lng: e.latlng.lng });
      setHasPlacedPin(true);
    },
  });
  return null;
}

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

// Helper component to fit bounds to both points
function FitBounds({ guess, actual }: { guess: [number, number]; actual: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    map.fitBounds([guess, actual], { padding: [40, 40] });
  }, [guess, actual, map]);
  return null;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export const Game = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentPhotoIndex: 0,
    score: 0,
    guesses: [],
  });
  const [hasStarted, setHasStarted] = useState(false);

  // Shuffle photos when game starts
  const shuffledPhotos = useMemo(() => {
    return shuffleArray(photos);
  }, [hasStarted]);

  const [locationGuess, setLocationGuess] = useState<LocationGuess>(STANFORD_COORDINATES);
  const [hasPlacedPin, setHasPlacedPin] = useState(false);
  const [dateIndex, setDateIndex] = useState<number>(0);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const { showToast } = useCustomToast();
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{
    actual: Photo;
    guess: { date: string; location: LocationGuess };
    score: number;
  } | null>(null);

  const dateGuess = formatDate(addDays(START_DATE, dateIndex));

  const calculateScore = (
    dateGuess: string,
    locationGuess: LocationGuess,
    photo: Photo
  ): number => {
    // Calculate distance in kilometers
    const distance = calculateDistance(
      locationGuess.lat,
      locationGuess.lng,
      photo.coordinates[0],
      photo.coordinates[1]
    ) * 1.60934; // convert miles to km

    // Location scoring: 5000 pts if within 10 meters, scale down to 0 at 5km
    let locationScore = 0;
    if (distance <= 0.01) {
      locationScore = 5000;
    } else if (distance < 5) {
      locationScore = Math.round(5000 * (1 - (distance / 5)));
    } // else 0

    // Date scoring: 5000 pts if exact, lose 100 per day off, min 0
    const guessDate = parseDate(dateGuess);
    const actualDate = parseDate(photo.actualDate);
    
    const daysDiff = Math.abs(differenceInDays(guessDate, actualDate));
    const dateScore = daysDiff === 0 ? 5000 : Math.max(0, 5000 - (daysDiff * 100));

    return locationScore + dateScore;
  };

  const handleGuess = () => {
    const currentPhoto = shuffledPhotos[gameState.currentPhotoIndex % shuffledPhotos.length];
    const score = calculateScore(dateGuess, locationGuess, currentPhoto);
    setLastResult({
      actual: currentPhoto,
      guess: { date: dateGuess, location: locationGuess },
      score,
    });
    setShowResult(true);
  };

  const handleNext = () => {
    setGameState(prev => ({
      ...prev,
      score: prev.score + (lastResult?.score || 0),
      guesses: [...prev.guesses, lastResult?.score || 0],
      currentPhotoIndex: prev.currentPhotoIndex + 1,
    }));
    setDateIndex(0);
    setShowResult(false);
    setLastResult(null);
    setHasPlacedPin(false);
    setLocationGuess(STANFORD_COORDINATES); // Reset map location to Stanford
  };

  // Get current photo from shuffled array
  const currentPhoto = shuffledPhotos[gameState.currentPhotoIndex % shuffledPhotos.length];

  // --- UI ---
  return (
    <Box minH="100vh" bg="primary.100">
      <Flex direction="column" minH="100vh" bg="primary.50">
        {/* Header */}
        <Flex
          as="header"
          align="center"
          justify="flex-start"
          px={8}
          py={2}
          borderBottom="8px solid #1976d2"
          bg="primary.50"
        >
          <Text fontSize="4xl" fontWeight="extrabold" color="primary.700" letterSpacing="tight">
            CHRONOSGUESSR
          </Text>
        </Flex>

        {!hasStarted ? (
          <Flex 
            flex="1" 
            direction="column" 
            align="center"
            justify="flex-start"
            w="100%"
            pt={6}
            px={8}
            gap={8}
            position="relative"
            overflow="hidden"
          >
            <Box 
              maxW="800px" 
              w="100%"
              textAlign="left"
              bg="white"
              p={12}
              borderRadius="2xl"
              boxShadow="2xl"
              position="relative"
              animation={`${fadeIn} 1s ease-out`}
            >
              <Heading
                fontSize={{ base: '2xl', md: '3xl', lg: '3xl' }}
                color="primary.700"
                mb={6}
                bgGradient="linear(to-r, primary.600, primary.400)"
                bgClip="text"
                letterSpacing="tight"
                fontWeight="extrabold"
              >
                HAPPY BIRTHDAY ANGELINA!!!
             </Heading>
              
              <Text 
                fontSize="xl" 
                color="gray.700" 
                mb={8} 
                whiteSpace="pre-line"
                lineHeight="1.8"
              >
                {"Hope you enjoy/enjoyed what the guys and I got for you, but this game was a literal 'shower thought' that I had last night, and I felt like I had to make it, so I did! Hope you enjoy."}
              </Text>
              
              <Box
                bg="primary.50"
                p={6}
                borderRadius="xl"
                mb={8}
                border="2px solid"
                borderColor="primary.200"
              >
                <Text 
                  fontSize="lg" 
                  color="primary.600" 
                  whiteSpace="pre-line"
                  fontStyle="italic"
                >
                  {"PS. The dates are in Greek/non-American format (dd/mm/yyyy) and also you should be super careful with the location (it is a smaller 'map' after all) ;-)"}
                </Text>
              </Box>
              
              <Box w="100%" display="flex" justifyContent="center">
                <Button
                  colorScheme="primary"
                  size="lg"
                  fontSize="2xl"
                  px={12}
                  py={8}
                  borderRadius="xl"
                  onClick={() => setHasStarted(true)}
                  boxShadow="xl"
                  _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "2xl",
                  }}
                  transition="all 0.2s"
                  animation={`${pulse} 2s infinite`}
                >
                  Start Game
                </Button>
              </Box>
            </Box>
          </Flex>
        ) : (
          <>
            {/* Main Content */}
            <Flex flex="1" justify="center" align="flex-start" p={8} gap={8}>
              {/* Left: Image */}
              <Box
                borderRadius="2xl"
                boxShadow="2xl"
                p={4}
                maxW="500px"
                w="500px"
                h="500px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="2px solid black"
              >
                {currentPhoto && (
                  <Image
                    src={`${import.meta.env.BASE_URL}${currentPhoto.url.replace(/^\//, '')}`}
                    alt={currentPhoto.location}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '16px' }}
                  />
                )}
              </Box>

              {/* Right: Controls */}
              <VStack align="stretch" spacing={8} w="350px">
                {/* Score Card */}
                <Box bg="primary.500" color="white" borderRadius="xl" p={4} textAlign="right" fontWeight="bold" fontSize="2xl" boxShadow="lg">
                  <Flex justify="space-between">
                    <Text>Round</Text>
                    <Text>Score</Text>
                  </Flex>
                  <Flex justify="space-between" fontSize="3xl">
                    <Text>{Math.min(gameState.currentPhotoIndex + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</Text>
                    <Text>{gameState.score}</Text>
                  </Flex>
                </Box>

                {/* Map */}
                <Box position="relative" h="200px" w="100%" borderRadius="xl" overflow="hidden" boxShadow="md" border="2px solid #ccc">
                  <MapContainer
                    center={[locationGuess.lat, locationGuess.lng] as [number, number]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                    <Marker position={[locationGuess.lat, locationGuess.lng] as [number, number]} icon={markerIcon} />
                    <LocationPicker locationGuess={locationGuess} setLocationGuess={setLocationGuess} setHasPlacedPin={setHasPlacedPin} />
                  </MapContainer>
                  {!isMapFullscreen && (
                    <IconButton
                      aria-label="Fullscreen map"
                      icon={<Text fontSize="2xl" color="black">⛶</Text>}
                      position="absolute"
                      top={2}
                      right={2}
                      onClick={() => setIsMapFullscreen(true)}
                      variant="ghost"
                      bg="transparent"
                      _hover={{ bg: 'blackAlpha.100' }}
                      boxShadow="none"
                      zIndex={1001}
                      size="sm"
                      borderRadius="md"
                    />
                  )}
                </Box>

                {/* Slider/Guess */}
                <VStack spacing={4} align="stretch">
                  <Box bg="primary.500" color="white" borderRadius="full" px={8} py={2} fontSize="2xl" fontWeight="bold" textAlign="center">
                    {formatDate(addDays(START_DATE, dateIndex))}
                  </Box>
                  <Slider colorScheme="primary" min={0} max={TOTAL_DAYS} value={dateIndex} onChange={setDateIndex}>
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                  <Button w="100%" colorScheme="primary" borderRadius="xl" fontWeight="bold" fontSize="lg" onClick={handleGuess}>
                    {hasPlacedPin ? "Submit guess" : "Place your pin on the map"}
                  </Button>
                </VStack>
              </VStack>
            </Flex>

            {/* Fullscreen Map Overlay */}
            {isMapFullscreen && (
              <Flex
                position="fixed"
                top={0}
                left={0}
                w="100vw"
                h="100vh"
                bg="rgba(0,0,0,0.9)"
                zIndex={1000}
                direction="column"
              >
                <Flex as="header" h="80px" align="center" justify="flex-end" pr={8} pl={8} pt={2} pb={2}>
                  <Button
                    onClick={() => setIsMapFullscreen(false)}
                    colorScheme="whiteAlpha"
                    size="lg"
                    borderRadius="xl"
                  >
                    Close Map
                  </Button>
                </Flex>
                <Box flex="1" w="100%">
                  <MapContainer
                    center={[locationGuess.lat, locationGuess.lng] as [number, number]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                    <Marker position={[locationGuess.lat, locationGuess.lng] as [number, number]} icon={markerIcon} />
                    <LocationPicker locationGuess={locationGuess} setLocationGuess={setLocationGuess} setHasPlacedPin={setHasPlacedPin} />
                  </MapContainer>
                </Box>
              </Flex>
            )}

            {/* Intermediary Results Overlay */}
            {showResult && lastResult && (
              <Flex position="fixed" top={0} left={0} w="100vw" h="100vh" bg="rgba(0,0,0,0.8)" align="center" justify="center" zIndex={2000}>
                <Box bg="white" p={10} borderRadius="2xl" boxShadow="2xl" maxW="900px" w="90vw">
                  <Heading size="lg" color="primary.500" mb={4} textAlign="left">Round Results</Heading>
                  <Flex direction={{ base: 'column', md: 'row' }} gap={8} align="stretch">
                    {/* Left column: image and info */}
                    <VStack align="stretch" flex={1} spacing={4} minW="260px">
                      <Image
                        src={`${import.meta.env.BASE_URL}${lastResult.actual.url.replace(/^\//, '')}`}
                        alt={lastResult.actual.location}
                        style={{ width: '100%', height: 'auto', maxHeight: 340, maxWidth: '100%', borderRadius: '16px', objectFit: 'contain', marginBottom: 16 }}
                      />
                      {lastResult.actual.message && (
                        <Text fontSize="2xl" fontWeight="bold" color="primary.700" mb={2}>{lastResult.actual.message}</Text>
                      )}
                      <Text><b>Your Guess:</b> {lastResult.guess.date} @ [{lastResult.guess.location.lat.toFixed(4)}, {lastResult.guess.location.lng.toFixed(4)}]</Text>
                      <Text><b>Actual:</b> {lastResult.actual.actualDate} @ [{lastResult.actual.coordinates[0].toFixed(4)}, {lastResult.actual.coordinates[1].toFixed(4)}]</Text>
                      <Text><b>Location:</b> {lastResult.actual.location}</Text>
                    </VStack>
                    {/* Right column: map and results */}
                    <VStack align="stretch" flex={1} spacing={4} minW="320px">
                      <div style={{ width: '100%', height: '250px', borderRadius: '16px', overflow: 'hidden', border: '2px solid #ccc' }}>
                        <MapContainer
                          style={{ width: '100%', height: '100%' }}
                          center={[
                            (lastResult.guess.location.lat + lastResult.actual.coordinates[0]) / 2,
                            (lastResult.guess.location.lng + lastResult.actual.coordinates[1]) / 2
                          ] as [number, number]}
                          zoom={12}
                          scrollWheelZoom={false}
                          dragging={false}
                          doubleClickZoom={false}
                          zoomControl={false}
                          attributionControl={false}
                        >
                          <FitBounds
                            guess={[lastResult.guess.location.lat, lastResult.guess.location.lng]}
                            actual={[lastResult.actual.coordinates[0], lastResult.actual.coordinates[1]]}
                          />
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; OpenStreetMap contributors"
                          />
                          {/* User Guess Marker */}
                          <Marker
                            position={[lastResult.guess.location.lat, lastResult.guess.location.lng] as [number, number]}
                            icon={new L.Icon({
                              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                              iconSize: [25, 41],
                              iconAnchor: [12, 41],
                              popupAnchor: [1, -34],
                              shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
                              shadowSize: [41, 41],
                            })}
                          >
                            <Popup>Your Guess</Popup>
                          </Marker>
                          {/* Actual Location Marker */}
                          <Marker
                            position={[lastResult.actual.coordinates[0], lastResult.actual.coordinates[1]] as [number, number]}
                            icon={new L.Icon({
                              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                              iconSize: [25, 41],
                              iconAnchor: [12, 41],
                              popupAnchor: [1, -34],
                              shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
                              shadowSize: [41, 41],
                            })}
                          >
                            <Popup>Actual Location</Popup>
                          </Marker>
                          {/* Line between guess and actual */}
                          <Polyline
                            positions={[
                              [lastResult.guess.location.lat, lastResult.guess.location.lng],
                              [lastResult.actual.coordinates[0], lastResult.actual.coordinates[1]]
                            ]}
                            pathOptions={{ color: 'orange', weight: 4, opacity: 0.7 }}
                          />
                        </MapContainer>
                      </div>
                      {/* Distance and date difference display */}
                      {(() => {
                        const distanceMiles = calculateDistance(
                          lastResult.guess.location.lat,
                          lastResult.guess.location.lng,
                          lastResult.actual.coordinates[0],
                          lastResult.actual.coordinates[1]
                        );
                        const distanceKm = distanceMiles * 1.60934;
                        const daysDiff = Math.abs(differenceInDays(
                          parseDate(lastResult.guess.date),
                          parseDate(lastResult.actual.actualDate)
                        ));
                        return (
                          <VStack spacing={1} mb={2} align="stretch">
                            <Text fontSize="xl" color="primary.700" fontWeight="bold">
                              You were {distanceKm.toFixed(1)} km ({distanceMiles.toFixed(1)} miles) from the correct location
                            </Text>
                            <Text fontSize="lg" color="primary.700">
                              You were {daysDiff} day{daysDiff === 1 ? '' : 's'} off on the date
                            </Text>
                          </VStack>
                        );
                      })()}
                      <Text fontSize="2xl" color="primary.700" fontWeight="bold" mb={2}>Score: {lastResult.score}</Text>
                      <Button colorScheme="primary" size="lg" borderRadius="xl" onClick={handleNext} alignSelf="flex-end">Next</Button>
                    </VStack>
                  </Flex>
                </Box>
              </Flex>
            )}

            {/* Game Complete Overlay */}
            {gameState.currentPhotoIndex >= TOTAL_ROUNDS && (
              <Flex position="fixed" top={0} left={0} w="100vw" h="100vh" bg="rgba(0,0,0,0.7)" align="center" justify="center" zIndex={1000}>
                <Box bg="white" p={12} borderRadius="2xl" boxShadow="2xl" textAlign="center">
                  <Heading size="2xl" color="primary.500" mb={4}>Game Complete!</Heading>
                  <Text mt={4} fontSize="2xl" color="gray.800">Final Score: {gameState.score}</Text>
                  <Text color="gray.600">Average Score: {Math.round(gameState.guesses.reduce((a, b) => a + b, 0) / gameState.guesses.length)}</Text>
                  <Button mt={8} colorScheme="primary" size="lg" borderRadius="xl" onClick={() => setGameState({ currentPhotoIndex: 0, score: 0, guesses: [] })}>
                    Play Again
                  </Button>
                </Box>
              </Flex>
            )}
          </>
        )}
      </Flex>
    </Box>
  );
};
