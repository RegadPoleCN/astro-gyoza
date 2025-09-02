import { useEffect } from 'react';

import 'APlayer/dist/APlayer.min.css';
import APlayer from 'APlayer';
import qs from 'qs';
import { player as playerConfig } from '@/config.json';

export default function Music() {
    useEffect(()=>{
        getPlayer();
    })
}

async function getPlayer() {
    let params = {
        server: playerConfig.server,
        type: playerConfig.type,
        id: playerConfig.id,
        r: Math.random()
    };
    let url;
    if(!playerConfig.api || playerConfig.api.trim().length === 0) {
        url = 'https://api.i-meto.com/meting/api';
    } else {
        url = playerConfig.api;
    }
    //拼接参数  
    url += '?' + qs.stringify(params, { strictNullHandling: true });
    // ?server=netease&type=playlist&id=60192&r=0.49295886527008737
    let res = await fetch(url, {});
    let data = await res.json();
    new APlayer({
        element: document.getElementById('aplayer'),
        autoplay: false,
        theme: '#ffacd8ff',
        loop: 'all',
        fixed: true,
        mini: true,
        lrcType: 3,
        preload: 'none',
        audio: [...data.map((el: { lrc: any; title: any; author: any; url: any; pic: any; }) => ({
            lrc: el.lrc,
            name: el.title,
            artist: el.author,
            url: el.url,
            cover: el.pic,
        }))],
    });
}