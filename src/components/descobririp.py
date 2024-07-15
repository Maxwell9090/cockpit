import socket

def check_port(ip, port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)  # Timeout para a tentativa de conexão
    result = sock.connect_ex((ip, port))
    sock.close()
    return result == 0

def scan_network(ip_prefix, port):
    available_ips = []
    for i in range(1, 255):
        ip = f"{ip_prefix}.{i}"
        if not check_port(ip, port):
            available_ips.append(ip)
    return available_ips

# Defina a faixa de IPs e a porta que você quer verificar
ip_prefix = "172.26.12"  # Remover 'http://'
port = 3000

available_ips = scan_network(ip_prefix, port)
if available_ips:
    print("IP(s) com porta disponível:")
    for ip in available_ips:
        print(ip)
else:
    print("Nenhum IP disponível com a porta especificada.")
