import useWeb3Forms from '@web3forms/react';

// Add inside your function
const accessKey = 'YOUR_ACCESS_KEY_HERE';
const { submit } = useWeb3Forms({
  access_key: accessKey,
  settings: {
    from_name: 'Acme Inc',
    subject: 'New Contact Message from your Website',
  },
  onSuccess: (message, data) => {
    console.log(message);
  },
  onError: (message, data) => {
    console.log(message);
  },
});