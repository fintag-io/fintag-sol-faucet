import { Box, Button, Input } from "@chakra-ui/react"

const App = () => {
  return (
    <Box>
      <Box>
        <p>Devnet Faucet</p>
      </Box>
      <Box>
        <Input
          placeholder="Enter your wallet address"
        />
        <Input
          placeholder="Enter the amount to request"
          type="number"
          min="0"
        />
        <Button>Request</Button>
      </Box>
    </Box>
  )
}

export default App