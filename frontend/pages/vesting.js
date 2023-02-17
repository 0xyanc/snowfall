import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import VestingList from '@/components/VestingList/VestingList'

export default function Home() {
  return (
    <>
      <Head>
        <title>Snowfall Vesting</title>
        <meta name="description" content="Vesting page of Snowfall DApp" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <VestingList />
    </>
  )
}
