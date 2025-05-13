import { Container } from '@chakra-ui/react'
import { Game } from './components/Game'

function App() {
  return (
    <Container maxW="container.xl" py={8}>
      <Game />
    </Container>
  )
}

export default App
