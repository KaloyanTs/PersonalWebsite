import useWeb3Forms from '@web3forms/react';

// Add inside your function
const accessKey = '22f1cfb2-0e7a-478f-9db4-bccd0e0265a4';
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