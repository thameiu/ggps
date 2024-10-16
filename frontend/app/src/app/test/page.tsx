"use client"
import { useEffect, useState } from 'react';
import axios from 'axios';

const Example = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.post('http://localhost:9000/auth/login')
      .then((response) => setData(response.data))
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  return (
    <div>
      <h1>Data from Nestjs</h1>
      {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : <p>Loading...</p>}
    </div>
  );
};

export default Example;
