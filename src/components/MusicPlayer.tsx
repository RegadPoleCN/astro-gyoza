import 'APlayer/dist/APlayer.min.css';
import APlayer from 'APlayer';

export function Music() {
    const ap = new APlayer({
        element: document.getElementById('aplayer'),
        showlrc: false,
        fixed: true,
        mini: true,
        audio: {
            title: '半岛铁盒',
            author: '周杰伦',
            url: 'https://echeverra.cn/wp-content/uploads/2022/05/周杰伦-半岛铁盒.mp3',
            pic: 'https://echeverra.cn/wp-content/uploads/2022/05/周杰伦-半岛铁盒-mp3-image.png'
        }
    });
    ap.init();
}