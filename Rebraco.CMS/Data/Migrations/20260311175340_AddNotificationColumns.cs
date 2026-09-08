using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rebraco.CMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ExpiryNotifiedAt",
                schema: "rebraco",
                table: "Leases",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "OverdueNotifiedAt",
                schema: "rebraco",
                table: "Invoices",
                type: "datetimeoffset",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExpiryNotifiedAt",
                schema: "rebraco",
                table: "Leases");

            migrationBuilder.DropColumn(
                name: "OverdueNotifiedAt",
                schema: "rebraco",
                table: "Invoices");
        }
    }
}
