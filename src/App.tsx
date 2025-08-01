import { Box, Button, Image, Input, Text} from "@chakra-ui/react"
import { useState } from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Toaster, toaster } from "./components/ui/toaster";
import { Spinner } from "@chakra-ui/react";

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

const App = () => {
  const AIRDROP_AMOUNT = 5;

  const [walletAddress, setWalletAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const requestAirdrop = async () => {
    if (!walletAddress) {
      console.error("Wallet address is required");
      toaster.warning({
        title: "Wallet Address Required",
        description: "Please enter a wallet address to request an airdrop.",
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);
      const publicKey = new PublicKey(walletAddress);
      const airdropSignature = await connection.requestAirdrop(publicKey, AIRDROP_AMOUNT * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(airdropSignature, 'confirmed');
      console.log(`Airdrop successful for ${walletAddress}`);
      setWalletAddress("");
      toaster.success({
        title: "Airdrop Successful",
        description: `${AIRDROP_AMOUNT} SOL has been sent to ${walletAddress}`,
        duration: 3000,
      }); 
    } catch (error) {
      console.error("Airdrop failed:", error);
      // const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toaster.error({
        title: "Airdrop Failed",
        description: `Could not send SOL`,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box display='flex' overflowX='hidden' w='100%' flexDirection='column' alignItems='center' justifyContent='center' minHeight='100vh'>
      <Toaster />
      <Box m='20px'>
        <Image src="./src/assets/logo.png" alt="Fintag Logo" style={{ width: '60px', height: '60px' }} />
      </Box>
      <Box mb='20px'>
        <Text as="p" fontWeight='bold' textAlign='center' fontSize='24px'>SOL Devnet Faucet</Text>
      </Box>
      <Box display='flex' w='100%' px='20px' flexDirection={{ base: 'column', md: 'row' }} alignItems='center' justifyContent='center' mt={4}>
        <Input
          placeholder="Enter your wallet address"
          borderRadius='0'
          width={{base: '100%', md:'400px' }}
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          disabled={isLoading}
        />
        <Button borderRadius='0' ml={{base: '0', md:'5px'}} mt={{base: '5px', md:'0'}}
        onClick={requestAirdrop}
        disabled={isLoading}
        >
        Request {AIRDROP_AMOUNT} SOL
        {isLoading && <Spinner size='sm' ml='5px' />}
        </Button>
      </Box>
    </Box>
  )
}

export default App