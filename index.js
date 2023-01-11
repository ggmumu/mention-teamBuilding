const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

const { WebClient } = require('@slack/web-api');

const token = process.env.SLACK_TOKEN;
const web = new WebClient(token);

express()
.use(express.static(path.join(__dirname, 'public')))
.use(express.json())
.set('views', path.join(__dirname, 'views'))
.set('view engine', 'ejs')
.get('/', (req, res) => res.render('pages/index'))  
.post('/slack/events', (req, res) => {
    let body = req.body;
    let event = body.event;

    const members = process.env.MEMBERS; // MEMBERS 받아오기
    const memberData = members.split(' '); // 공백으로 쪼개서 멤버 배열 생성
    const numberOfPlayers = memberData.length;
    const numberOfTeams = process.env.TEAMS;
    
    const remainder = numberOfPlayers % numberOfTeams;
    const minPerTeam = Math.floor(numberOfPlayers / numberOfTeams); // 한 팀 최소 인원
    
    let maxPerTeam = minPerTeam;
    if (remainder > 0){
    maxPerTeam ++; // 나머지가 있으면 한 팀 최대 인원을 +1
    }

    // memberData 랜덤으로 배열 순서 변경
    memberData.sort(function(a, b){return 0.5 - Math.random()});

    // 2차원 배열 선언 team[numberOfTeams][maxPerTeam] 후 초기화
    const team = Array.from(Array(numberOfTeams), () => new Array(maxPerTeam).fill(null));

    // memberData를 2차 배열에 추가. 2차배열[0]부터 minPerTeam만큼 추가하면, 2차배열[1]부터 minPerTeam만큼 ~~ 
    for (let i = 0; i < numberOfTeams; i++){
      team[i] = memberData.slice(minPerTeam*i, minPerTeam*(i+1));
    }

    // remainder > 0 이면 남은 사람들 2차배열에 추가하는 작업 필요
    for (let i = 0; i < remainder; i++){
      team[i][minPerTeam] = memberData.slice(numberOfPlayers-remainder+i, numberOfPlayers-remainder+i+1);
    }
                
    // 2차 배열 매핑
    const teamList = team.map((item, idx) => `${idx + 1}팀: ${item}\n`).join('');
    
    // teamList 출력
    web.chat.postMessage({
      channel: event.channel,
      text: `오늘의 팀 :pk_chicken:\n${teamList} 치킨 :_bv_gazaaa:`
    }).then(result => {
      console.log('Message sent: ' + result.ts)
    });

    res.sendStatus(200);    
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
